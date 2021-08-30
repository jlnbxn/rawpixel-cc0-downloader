const fetch = require("node-fetch");
const fs = require("fs");
var path = require("path");
const readline = require("readline");
const prompts = require("prompts");

const SESSION_COOKIE =
    "YOUR_SESSION_COOKIE"; // session cookie expires ten years after generation

const ensureDirectoryExistence = (filePath) => {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
};

const scrape = async () => {
    const search = await fetch(
        "https://www.rawpixel.com/api/v1/boards?page=1&pagesize=10000&with_images=1&sort=changed&html=0&rawpixel_board=1&category=53" // category equals cc0 collection
    )
        .then((res) => res.json())
        .catch((err) => console.log(err));

    const boards = search.results.map((board) => board);

    for (let board of boards) {
        await getImages(board.nid, board.title);
    }
};

const getImages = async (boardId, boardName) => {
    const search = await fetch(
        `https://www.rawpixel.com/api/v1/search?keys=&page=1&board=${boardId}&sort=curated&premium=&mode=shop&pagesize=1000&auth=1&html=0`
    )
        .then((res) => res.json())
        .catch((err) => console.log(err));

    const images = search.results.map((image) => image);

    for (let i = 0; i < 5; i++) {
        if (!images[i]) return;

        try {
            await download(images[i], boardName);
        } catch (err) {
            console.log(err);
        }
    }
};

const download = async (image, boardTitle) => {
    const { id } = image;

    // add case switch for quality

    // use cookie to get download url
    const response = await fetch(`https://www.rawpixel.com/download/${id}/jpeg`, {
        method: "POST",
        headers: {
            cookie: SESSION_COOKIE,
        },
    })
        .then((res) => res.json())
        .catch((err) => console.log(err));

    let fileName = `./images/${boardTitle}/${id}.jpeg`;

    ensureDirectoryExistence(fileName);

    const res = await fetch(response.download_url);
    const fileStream = fs.createWriteStream(fileName);
    res.body.pipe(fileStream);
};

scrape();
