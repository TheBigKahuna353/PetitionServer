import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as images from "../models/user.image.model";
import {LoadImageFile, SaveImageFile} from "../services/image.loader";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try{

        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.statusMessage = "Bad Request: User ID must be an integer";
            res.status(400).send();
            return;
        }
        const filename = await images.get(userId);
        if(filename.length === 0){
            res.statusMessage = "Not Found: No user with specified ID";
            res.status(404).send();
            return;
        }
        if (filename[0].image_filename === null) {
            res.statusMessage = "Not Found: No image found for user";
            res.status(404).send();
            return;
        }
        const image = await LoadImageFile(filename[0].image_filename);
        res.setHeader('Content-Type', 'image/' + filename[0].image_filename.split('.')[1]);
        res.status(200).send(image);

    } catch (err) {
        if (err.code === 'ENOENT') {
            res.statusMessage = "Not Found on server";
            res.status(404).send();
            return;
        }
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    try{
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.statusMessage = "Bad Request: User ID must be an integer";
            res.status(400).send();
            return;
        }
        const token = req.header('X-Authorization');
        if (!token) {
            res.statusMessage = "Unauthorized: No token provided";
            res.status(401).send();
            return;
        }
        const userToken = await images.getTokenAndImage(userId);
        if(userToken.length === 0){
            res.statusMessage = "Not Found: No user with specified ID";
            res.status(404).send();
            return;
        }
        if(userToken[0].auth_token !== token){
            Logger.debug(userToken[0].auth_token);
            res.statusMessage = "Forbidden: Invalid token";
            res.status(403).send();
            return;
        }
        const image = req.body;
        if(!image){
            res.statusMessage = "Bad Request: No image provided";
            res.status(400).send();
            return;
        }
        let filetype = req.header('Content-Type');
        Logger.debug(filetype);
        if(!filetype){
            res.statusMessage = "Bad Request: No Content-Type provided";
            res.status(400).send();
            return;
        }
        filetype = filetype.split(';')[0];
        const validTypes = ['image/png', 'image/jpeg', 'image/gif'];
        if(!validTypes.includes(filetype)){
            res.statusMessage = "Bad Request: Invalid file type";
            res.status(400).send();
            return;
        }
        filetype = filetype.split('/')[1];
        const created = userToken[0].image_filename === null;

        const filename = `${userId}.${filetype}`;
        await SaveImageFile(filename, image);
        await images.save(userId, filename);

        if (created) {
            res.status(201).send();
        } else {
            res.status(200).send();
        }

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try{
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.statusMessage = "Bad Request: User ID must be an integer";
            res.status(400).send();
            return;
        }
        const token = req.header('X-Authorization');
        if (!token) {
            res.statusMessage = "Unauthorized: No token provided";
            res.status(401).send();
            return;
        }
        const userToken = await images.getTokenAndImage(userId);
        if(userToken.length === 0){
            res.statusMessage = "Not Found: No user with specified ID";
            res.status(404).send();
            return;
        }
        if(userToken[0].auth_token !== token){
            res.statusMessage = "Forbidden: Invalid token";
            res.status(403).send();
            return;
        }
        await images.remove(userId);
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getImage, setImage, deleteImage}