import fs from "fs";

const LoadImageFile = async (filename: string): Promise<Buffer> => {
    try{
        const image = fs.readFileSync(`./storage/images/${filename}`);
        return image;
    } catch (err) {
        throw err;
    }
}

const SaveImageFile = async (filename: string, image: Buffer): Promise<void> => {
    try{
        fs.writeFileSync(`./storage/images/${filename}`, image);
    } catch (err) {
        throw err;
    }
}

export  {LoadImageFile, SaveImageFile}