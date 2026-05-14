import fs from "fs";
import path from "path";
import { execSync } from "child_process";

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
    "https://t.me/c/3199042265/22",
    "https://t.me/c/3199042265/23",
    "https://t.me/c/3199042265/24",
    "https://t.me/c/3199042265/25",
    "https://t.me/c/3199042265/26",
    "https://t.me/c/3199042265/27",
    "https://t.me/c/3199042265/28",
    "https://t.me/c/3199042265/29",
    "https://t.me/c/3199042265/30",
    "https://t.me/c/3199042265/31",
    "https://t.me/c/3199042265/32",
    "https://t.me/c/3199042265/33",
];

function parseLink(link) {

    const url = new URL(link);

    const parts = url.pathname
        .split("/")
        .filter(Boolean);

    return {
        chatId: Number(`-100${parts[1]}`),
        messageId: Number(parts[2]),
    };
}

function gitCommit(filePath, fileName) {

    try {

        execSync(`git add "${filePath}"`, {
            stdio: "inherit",
        });

        execSync(
            `git commit -m "add ${fileName}"`,
            {
                stdio: "inherit",
            }
        );

        execSync(`git push`, {
            stdio: "inherit",
        });

        console.log(`committed ${fileName}`);

    } catch (err) {

        console.log(`nothing to commit for ${fileName}`);

    }
}

async function main() {

    await client.connect();

    console.log("connected");

    fs.mkdirSync("downloads", {
        recursive: true,
    });

    for (const link of links) {

        try {

            const { chatId, messageId } =
                parseLink(link);

            console.log(`processing ${link}`);

            const messages =
                await client.getMessages(chatId, {
                    ids: messageId,
                });

            const msg = messages[0];

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

            const safeName =
                originalName.replace(
                    /[\\/:*?"<>|]/g,
                    "_"
                );

            const outputPath = path.join(
                "downloads",
                safeName
            );

            if (fs.existsSync(outputPath)) {

                console.log(
                    `already exists: ${safeName}`
                );

                continue;
            }

            console.log(
                `downloading ${safeName}`
            );

            await client.downloadMedia(msg, {
                outputFile: outputPath,
            });

            console.log(
                `saved -> ${outputPath}`
            );

            gitCommit(outputPath, safeName);

        } catch (err) {

            console.error(`failed: ${link}`);
            console.error(err);

        }
    }

    await client.disconnect();

    console.log("done");
}

main();
