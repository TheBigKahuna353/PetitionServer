import {Request, Response} from "express";
import Logger from "../../config/logger";
import {getOne} from "../models/petitions.model";
import * as supportersModel from "../models/supporters.model";
import * as supporterTiersModel from "../models/supporter_tiers.model";
import { getOneFromToken } from "../models/user.model";
import validate from '../services/validate';

import * as schemas from '../resources/schemas.json'


const getAllSupportersForPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        /*
        things to validate:
            - petition id is a number
            - petition exists

        */
            // validate petition id
            const petitionId = parseInt(req.params.id, 10);
            if (isNaN(petitionId)) {
                res.statusMessage = "Bad Request";
                res.status(400).send();
                return;
            }
            // validate petition exists
            const petition = await getOne(petitionId);
            if (petition.length === 0) {
                res.statusMessage = "Not Found";
                res.status(404).send();
                return;
            }
            // get all supporters
            const supporters = await supportersModel.getAllSupportersForPetition(petitionId);
            res.statusMessage = "OK";
            const supportersList = [];
            for (const supporter of supporters) {
                supportersList.push({
                    supportId: supporter.id,
                    supportTierId: supporter.support_tier_id,
                    message: supporter.message,
                    supporterId: supporter.user_id,
                    supporterFirstName: supporter.first_name,
                    supporterLastName: supporter.last_name,
                    timestamp: supporter.timestamp
                });
            }
            res.status(200).send(supportersList);

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addSupporter = async (req: Request, res: Response): Promise<void> => {
    try{
        /*
        things to validate:
            - petition id is a number
            - petition exists
            - support tier id is a number - validate
            - support tier exists
            - token, not null
            - token exists in database
            - user isnt already a supporter
            - user isnt the owner of the petition
        */

        // validate
        const schema = schemas.support_post;
        const validation = await validate(schema, req.body);
        if(validation !== true){
            res.statusMessage = validation;
            res.status(400).send();
            return;
        }

        // validate petition id
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "Bad Request: petition id is not a number";
            res.status(400).send();
            return;
        }
        // validate petition exists
        const petition = await getOne(petitionId);
        if (petition.length === 0) {
            res.statusMessage = "Not Found: petition does not exist";
            res.status(404).send();
            return;
        }

        const supportTierId = parseInt(req.body.supportTierId, 10);
        // validate support tier exists
        const supportTier = await supporterTiersModel.getSupportTier(supportTierId);
        if (supportTier.length === 0) {
            res.statusMessage = "Not Found: support tier does not exist";
            res.status(404).send();
            return;
        }
        // validate token
        const token = req.header('X-Authorization');
        if (!token) {
            res.statusMessage = "Unauthorized: No token provided";
            res.status(401).send();
            return;
        }
        // validate token exists in database
        const user = await getOneFromToken(token);
        if (user.length === 0) {
            res.statusMessage = "Unauthorized: Invalid token";
            res.status(401).send();
            return;
        }
        // validate user isnt already a supporter for this tier
        const supporters = await supportersModel.getAllSupportersForTier(supportTierId);
        if (supporters.some(supporter => supporter.user_id === user[0].id)) {
            res.statusMessage = "Already supported at this tier";
            res.status(403).send();
            return;
        }
        // validate user isnt the owner of the petition
        if (petition[0].owner_id === user[0].id) {
            res.statusMessage = "Cannot support your own petition";
            res.status(403).send();
            return;
        }
        // add supporter
        await supportersModel.insertSupporter(petitionId, supportTierId, user[0].id, req.body.message);
        res.statusMessage = "Created";
        res.status(201).send();


    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getAllSupportersForPetition, addSupporter}