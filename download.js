import fs from "fs";
import path from "path";

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

const apiId = Number(process.env.TG_API_ID);
const apiHash = process.env.TG_API_HASH;
const session = process.env.TG_SESSION;

const client = new TelegramClient(
    new StringSession(session),
    apiId,
    apiHash,
    {
        connectionRetries: 5,
    }
);

const links = [
    "https://t.me/c/3199042265/9",
    "https://t.me/c/3199042265/10",
    "https://t.me/c/3199042265/11",
    "https://t.me/c/3199042265/12",
    "https://t.me/c/3199042265/13",
    "https://t.me/c/3199042265/14",
    "https://t.me/c/3199042265/15",
    "https://t.me/c/3199042265/16",
    "https://t.me/c/3199042265/17",
    "https://t.me/c/3199042265/18",
    "https://t.me/c/3199042265/19",
    "https://t.me/c/3199042265/20"
];

function parseLink(link) {
    const url = new URL(link);

    const parts = url.pathname.split("/").filter(Boolean);

    return {
        chatId: Number(`-100${parts[1]}`),
        messageId: Number(parts[2]),
    };
}

async function main() {
    await client.connect();

    console.log("connected");

    fs.mkdirSync("downloads", { recursive: true });

    for (const link of links) {
        try {
            const { chatId, messageId } = parseLink(link);

            console.log(`processing ${link}`);

            const msg = await client.getMessages(chatId, {
                ids: messageId,
            });

            if (!msg) {
                console.log("message not found");
                continue;
            }

            if (!msg.media) {
                console.log("no media in message");
                continue;
            }

            const originalName =
                msg.file?.name ||
                `file_${messageId}`;

            const safeName = originalName.replace(
                /[\\/:*?"<>|]/g,
                "_"
            );

            const outputPath = path.join(
                "downloads",
                safeName
            );

            if (fs.existsSync(outputPath)) {
                console.log(`already exists: ${safeName}`);
                continue;
            }

            console.log(`downloading ${safeName}`);

            await client.downloadMedia(msg, {
                outputFile: outputPath,
            });

            console.log(`saved -> ${outputPath}`);
        } catch (err) {
            console.error(`failed: ${link}`);
            console.error(err);
        }
    }

    await client.disconnect();

    console.log("done");
}

main();
