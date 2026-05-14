import axios from "axios";
import fs from "fs";
import path from "path";
import { FILE_IDS } from "./files.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function downloadFile(fileId) {

    const fileInfo = await axios.get(
        `https://api.telegram.org/bot${BOT_TOKEN}/getFile`,
        { params: { file_id: fileId } }
    );

    const filePath = fileInfo.data.result.file_path;

    const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    const fileName = path.basename(filePath);

    const savePath = `downloads/${fileName}`;

    const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
    });

    await fs.promises.mkdir("downloads", { recursive: true });

    const writer = fs.createWriteStream(savePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
}

async function main() {

    for (const id of FILE_IDS) {

        console.log("Downloading:", id);

        try {
            await downloadFile(id);
            console.log("Done");
        } catch (e) {
            console.log("Failed", e.message);
        }

    }

}

main();
