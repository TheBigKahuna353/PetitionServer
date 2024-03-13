import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as images from "../models/petition.image.model";
import {LoadImageFile, SaveImageFile} from "../services/image.loader";
import * as petitions from "../models/petitions.model";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try{

        /*
        things to validate:
            - petition id is a number
            - petition exists
            - autorized to view the image
        */

        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
            return;
        }
        // check if petition exists
        const image = await images.getImage(petitionId);
        if(image.length === 0){
            res.statusMessage = "Not Found: No petition with specified ID";
            res.status(404).send();
            return;
        }
        if (image[0].image_filename === null) {
            res.statusMessage = "Not Found: No image found for petition";
            res.status(404).send();
            return;
        }
        const imageData = await LoadImageFile(image[0].image_filename);
        res.setHeader('Content-Type', 'image/' + image[0].image_filename.split('.')[1]);
        res.status(200).send(imageData);


    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    try{
        /*
        things to validate:
            - petition id is a number
            - petition exists
            - authorized to change the image
            - image is valid
        */
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "Bad Request: Petition ID must be an integer";
            res.status(400).send();
            return;
        }
        // check if petition exists
        const petition = await images.getImageAndToken(petitionId);
        if(petition.length === 0){
            res.statusMessage = "Not Found: No petition with specified ID";
            res.status(404).send();
            return;
        }
        const token = req.header('X-Authorization');
        if (!token) {
            res.statusMessage = "Unauthorized: No token provided";
            res.status(401).send();
            return;
        }
        if(petition[0].auth_token !== token){
            res.statusMessage = "Forbidden: Unauthorized to change image";
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
        if(!filetype){
            res.statusMessage = "Bad Request: No file type provided";
            res.status(400).send();
            return;
        }
        filetype = filetype.split('/')[1];
        const validTypes = ['jpeg', 'png', 'gif'];
        if(!validTypes.includes(filetype)){
            res.statusMessage = "Bad Request: Invalid file type";
            res.status(400).send();
            return;
        }
        const filename = "petition_" + petitionId + "." + filetype;
        await SaveImageFile(filename, image);
        await images.save(petitionId, filename);
        if (petition[0].image_filename === null) {
            res.status(201).send();
        } else {
            res.status(200).send();
        }
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


export {getImage, setImage};