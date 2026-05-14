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
    { connectionRetries: 5 }
);

function parseLink(link) {
    const url = new URL(link);
    const parts = url.pathname.split("/").filter(Boolean);

    return {
        chatId: Number(`-100${parts[1]}`),
        messageId: Number(parts[2]),
    };
}

function gitCommit() {
    try {
        execSync(`git add downloads links.txt`, { stdio: "inherit" });
        execSync(`git commit -m "download telegram files"`, { stdio: "inherit" });
        execSync(`git push`, { stdio: "inherit" });
    } catch { }
}

async function main() {

    await client.connect();

    fs.mkdirSync("downloads", { recursive: true });

    const lines = fs.readFileSync("links.txt", "utf8").split("\n");

    let changed = false;

    for (let i = 0; i < lines.length; i++) {

        const line = lines[i].trim();

        if (!line || line.startsWith("#")) continue;

        try {

            const { chatId, messageId } = parseLink(line);

            console.log("processing", line);

            const messages = await client.getMessages(chatId, {
                ids: messageId,
            });

            const msg = messages[0];

            if (!msg || !msg.media) {
                console.log("no media");
                continue;
            }

            const name =
                msg.file?.name ||
                `file_${messageId}`;

            const safeName = name.replace(/[\\/:*?"<>|]/g, "_");

            const output = path.join("downloads", safeName);

            if (fs.existsSync(output)) {
                console.log("already exists");
                lines[i] = "#" + line;
                changed = true;
                continue;
            }

            console.log("downloading", safeName);

            await client.downloadMedia(msg, {
                outputFile: output,
            });

            console.log("saved", output);

            lines[i] = "#" + line;
            changed = true;

            fs.writeFileSync("links.txt", lines.join("\n"));

            gitCommit();

        } catch (err) {
            console.log("failed", line);
            console.log(err);
        }
    }

    if (changed) {
        fs.writeFileSync("links.txt", lines.join("\n"));
    }

    await client.disconnect();

    console.log("done");
}

main();
