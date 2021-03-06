import { dependencies as Inject } from "needlepoint";
import Configuration from "../../core/config/Configuration";
import CommandModule from "../CommandModule";
import ChatApi from "../../core/api/ChatApi";
import ImagesClient from "google-images";
import Promise from "bluebird";
import request from "request";
import tmp from "tmp";
import * as fs from "fs";
import * as url from "url";
import * as path from "path";
import mime from "mime-types";

@Inject(Configuration, ChatApi)
export default class ShowMeCommand extends CommandModule {
    constructor(config, api) {
        super();

        this.api = api;

        this.defaultImageCount = config.getModuleConfig(this, "defaultImageCount");
        this.maxImageCount = config.getModuleConfig(this, "maxImageCount");

        this.imagesClient = new ImagesClient(
            config.getModuleConfig(this, "cseId"),
            config.getModuleConfig(this, "cseApiKey")
        );
    }

    getCommand() {
        return "showme";
    }

    getDescription() {
        return "Returns the first few images found in Google Images matching the query";
    }

    getUsage() {
        return "[numberOfImages] <query>";
    }

    validate(msg, argsString) {
        if (!argsString) return false;

        const opts = this.parseArgsString(argsString);
        if (!opts) return false;
        if (!opts.query) return false;

        return true;
    }

    execute(msg, query) {
        let tempFilesList = [];

        const opts = this.parseArgsString(query);

        return this.getImageUrls(opts.query, opts.imageCount)
            .then(urls => this.createTempFilesForUrls(urls).then(paths => {
                tempFilesList = paths;

                const writeStreams = paths.map(path => fs.createWriteStream(path));

                const completionPromises = urls.map((url, i) =>
                    new Promise((resolve, reject) =>
                        request.get(url)
                            .on('error', err => reject(err))
                            .pipe(writeStreams[i])
                            .on('close', () => resolve())
                    ));

                return Promise
                    .all(completionPromises)
                    .then(() => paths.map(path => fs.createReadStream(path)));
            }))
            .then(streams => ({
                attachment: streams
            }))
            .then(theMessage => this.api.sendMessage(theMessage, msg.threadID))
            .finally(() => {
                tempFilesList.forEach(path => fs.unlink(path));
            });
    }

    getImageUrls(query, imageCount) {
        return Promise.resolve(this.imagesClient.search(query))
            .then(images => images
                .slice(0, imageCount)
                .map(i => i.url)
            );
    }

    createTempFilesForUrls(urls) {
        const promises = urls.map(theUrl => {
            const pathname = url.parse(theUrl).pathname;
            const mimeType = mime.lookup(pathname);
            let extension = path.extname(pathname);

            // fallback to jpg if the extension is missing or not one for an image
            if (!mimeType || mimeType.split("/")[0] != "image") {
                extension = ".jpg";
            }

            return new Promise((resolve, reject) =>
                tmp.tmpName({
                    postfix: extension
                }, (err, path) => {
                    if (err) return reject(err);

                    return resolve(path);
                }))
        });

        return Promise.all(promises);
    }

    parseArgsString(argsString) {
        const m = argsString.match(/(\d+)\b(.*)|(.+)/);
        if (m === null) return undefined;

        const query = (m[2] || m[3] || m[1]).trim();
        const parsedImageCount = parseInt(m[2] ? m[1] : this.defaultImageCount);
        const normalizedImageCount = parsedImageCount <= 0 || parsedImageCount > this.maxImageCount
            ? this.defaultImageCount
            : parsedImageCount;

        return {
            query: query,
            imageCount: normalizedImageCount
        };
    }
}
