const
    padayon = require("./padayon"),
    OpenAI = require("openai"),
    server = require('../server'),
    messageController = require('./../controllers/message'),
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

module.exports.generateChatResponse = async (req, res) => {
    const directory = "Services::OpenAI::generateChatResponse";
    try {
        const { content, attachments } = req.body || {};
        const prompt = content?.message?.trim() || '';
        const payloadAttachments = _.isArray(attachments) ? attachments : [];
        const imageURL = _.size(payloadAttachments) > 0 ? payloadAttachments[0].url : null;

        const GPT_IMAGE_MODEL = "gpt-5-mini-2025-08-07";
        const GPT_TEXT_MODEL = "gpt-5-mini-2025-08-07";
        if (imageURL) {
            Object.assign(req, {
                model: GPT_IMAGE_MODEL,
                index: 1,
                prompt,
                imageURL
            });

            this.processWithOpenAI(req, res)
        } else {
            if (!prompt) throw new padayon.BadRequestException("Missing prompt. Please provide a prompt for Spoonwise AI.");

            Object.assign(req, {
                model: GPT_TEXT_MODEL,
                index: 0,
                prompt
            });
            this.processWithOpenAI(req, res)
        }
    } catch (error) {
        padayon.ErrorHandler(
            directory,
            error,
            req,
            res
        );
    }
}

module.exports.processWithOpenAI = async (req, res) => {
    try {
        const directory = "Services::OpenAI::invokeAI"
        const language = req.chatroom.settings.language;
        const pastMessages = req.chatroom.latestMessages.map(data => {
            return {
                role: data.isAIAgent ? "assistant" : "user",
                content: {
                    message: data.message,
                    attachments: data.attachments
                }
            }
        }).slice(0, 4);

        const prompts = [
            [{
                role: "system",
                content: `
            You are Spoonwise AI Developed by Marko Dulaca, a highly intelligent and PhD-level assistant specialized in fruits and food waste management.
             
            Language:
            Always respond in ${language} (a Philippine language), unless instructed otherwise.
       
            User Details:
        Full name : ${req.auth.fullname}

        Your mission is to:
        - Help people reduce food waste.
        - Identify fruit types and spoilage signs.
        - Provide storage, preservation, and sustainability tips.
        - Share creative ways to reuse or recycle fruit parts (like peels, seeds, or pulp) for cooking, composting, natural cleaners, or DIY uses.
        - Encourage sustainable living with friendly, practical, and accurate advice.

        Behavior Rules:

        1. If the user’s first name is available (from context), always greet them personally.
        2. If the user prompt is:
        - Related to fruits or food waste: Respond with expert-level knowledge.
        - Unrelated: Gently inform the user you only handle fruit and food waste topics. Use varied tone and friendly phrasing.

        Response Format:

            - Use only the following HTML tags: <br> <b> <i> <ol> <ul> like 1. 2. 3.
            - Do not use any other inline styles, script tags, or Angular bindings.
            - Keep formatting readable and friendly add emoticons.
            - Always use new line when needed.

        
        Here is the previous conversation for context:
        ${pastMessages.join('\n')}
        `},
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: req.prompt
                    }
                ]
            }],
            [{
                role: "system",
                content: `

            if ${req.prompt} is not related to fruits in the image, respond with friendly, practical, and accurate advice.
            and then

            You are a fruit and food waste detection expert and PhD-level assistant named Spoonwise AI.

            
            Language:
            Always respond in ${language} (a Philippine language), unless instructed otherwise.

            User Details:
            Full name : ${req.auth.fullname}

            Your mission is to:
            - Help people reduce food waste.
            - Identify fruit types and spoilage signs.
            - Provide storage, preservation, and sustainability tips.
            - Share creative ways to reuse or recycle fruit parts (like peels, seeds, or pulp) for cooking, composting, natural cleaners, or DIY uses.
            - Encourage sustainable living with friendly, practical, and accurate advice.

            Behavior Rules:

            1. If the user’s first name is available (from context), always greet them personally.
            2. If the user prompt is: 
            - Related to fruits or food waste: Respond with expert-level knowledge.
            - Unrelated: Gently inform the user you only handle fruit and food waste topics. Use varied tone and friendly phrasing.

            Response Format:

            - Use only the following HTML tags: <br> <b> <i> <ol> <ul> like 1. 2. 3.
            - Do not use any other inline styles, script tags, or Angular bindings.
            - Keep formatting readable and friendly add emoticons.
            - Always use new line when needed.

            Here is the previous conversation for context:
            ${pastMessages.join('\n')}
            `
            },

            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: req.prompt
                    },
                    {
                        type: "text",
                        text: `Please analyze the fruit in this image and give tips as described. `
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: req.imageURL
                        }
                    }
                ]
            },

            ]
        ]

        const startTime = Date.now();

        const stream = await openai.chat.completions.create({
            model: req.model,
            messages: prompts[req.index],
            stream: true
        });

        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        console.log(`OpenAI started the stream after ${duration} seconds`);

        const temporaryMessageId = Math.random().toString(36).substring(2, 9);
        let msg = '';

        for await (const chunk of stream) {
            const chunks = chunk.choices[0]?.delta?.content || "";

            if (chunks) {
                msg += chunks;
                server.io.to(req.auth._id).emit("onReceivedChunksFromAI", { chunks, temporaryMessageId });
            }

            // Detect when the stream ends
            if (chunk.choices[0]?.finish_reason) {
                Object.assign(req.body, {
                    content: {
                        message: msg
                    }
                });
                Object.assign(req.query, {
                    msgFromAIAgent: true
                })
                req.file = false;
                req.noEmitOnNewChatMessage = true;
                const sendMessage = await messageController.sendMessage(req, res);
                console.log('-----------sendMessage', sendMessage)

                server.io.to(req.auth._id).emit("onAIStreamComplete", { message: sendMessage, temporaryMessageId });
            }
        }
    } catch (error) {
        padayon.ErrorHandler(
            "Services::OpenAI::invokeAI",
            error,
            req,
            res
        );
    }



    /*
    const response = openai.chat.completions.create({
        model: req.model,
        messages: prompts[req.index],
    }).then(async (response) => {
        console.log(`${directory} Usage`, response.usage);
        const message = response.choices[0].message.content;
        // Immediately emit to frontend
        server.io.to(req.auth._id).emit('onNewChatMessage', {
            message: { content: { message } },
            chatroom: req.chatroom,
            isAIAgent: true
        });

        Object.assign(req.body, {
            content: {
                message
            }
        });
        Object.assign(req.query, {
            msgFromAIAgent: true
        })
        req.file = false;

        const sendMessage = await messageController.sendMessage(req, res);

        const receiverId = req.auth._id;
        const chatroom = req.chatroom;


    }
    ).catch((error) => {
        padayon.ErrorHandler(
            "Services::OpenAI::invokeAI",
            error,
            req,
            res
        );
    });
    */
}

