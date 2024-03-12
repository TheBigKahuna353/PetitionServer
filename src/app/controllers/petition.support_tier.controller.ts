import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as petitionModel from "../models/petitions.model";
import * as supportersModel from "../models/supporters.model";
import validate from '../services/validate';
import { getOneFromToken } from "../models/user.model";
import * as supportTiersModel from "../models/supporter_tiers.model";

import * as schemas from '../resources/schemas.json'

const addSupportTier = async (req: Request, res: Response): Promise<void> => {
    try{
        /*
            things to validate:
            - schema
            - petitionId, not NaN
            - token, not null
            - token exists in database
            - user is owner of petition
            - petition exists
            - petition does not already have 3 support tiers
            - title is unique

        */
       // validate schema
        const schema = schemas.support_tier_post;
        const validation = await validate(schema, req.body);
        if(validation !== true){
            res.statusMessage = validation;
            res.status(400).send();
            return;
        }
        // validate petitionId
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
            return;
        }
        // check Authorization
        const token = req.header('X-Authorization');
        if (!token) {
            res.statusMessage = "Unauthorized: No token provided";
            res.status(401).send();
            return;
        }
        // check if token exists in database
        const user = await getOneFromToken(token);
        if (user.length === 0) {
            res.statusMessage = "Unauthorized: Invalid token";
            res.status(401).send();
            return;
        }
        // check if petition exists
        const ownerId = user[0].id;
        const petition = await petitionModel.getOne(petitionId);
        if (petition.length === 0) {
            res.statusMessage = "Not Found: Petition not found";
            res.status(404).send();
            return;
        }
        // check if user is owner of petition
        if (petition[0].owner_id !== ownerId) {
            res.statusMessage = "Forbidden: You are not the owner of this petition";
            res.status(403).send();
            return;
        }
        // check if petition already has 3 support tiers
        const petitionSupportTiers = await supportTiersModel.getPetitionSupportTiers(petitionId);
        if (petitionSupportTiers.length >= 3) {
            res.statusMessage = "Forbidden: Petition already has 3 support tiers";
            res.status(403).send();
            return;
        }
        // check if title is unique
        const title = req.body.title;
        const description = req.body.description;
        const cost = req.body.cost;
        for (const tier of petitionSupportTiers) {
            if (tier.title === title) {
                res.statusMessage = "Forbidden: Petition already has a support tier with this title";
                res.status(403).send();
                return;
            }
        }

        await supportTiersModel.insertTier(petitionId, title, description, cost);
        res.statusMessage = "OK";
        res.status(201).send();


    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editSupportTier = async (req: Request, res: Response): Promise<void> => {
    try{
        /*
            things to validate:
            - schema
            - petitionId, not NaN
            - petition exists
            - teirId, not NaN
            - tier exists
            - token, not null
            - token exists in database
            - user is owner of petition
            - title is unique
            - no supporters have already supported this tier
        */
        const schema = schemas.support_tier_patch;
        const validation = await validate(schema, req.body);
        if(validation !== true){
            res.statusMessage = validation;
            res.status(400).send();
            return;
        }
        // validate petitionId
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
            return;
        }
        // check Authorization
        const token = req.header('X-Authorization');
        if (!token) {
            res.statusMessage = "Unauthorized: No token provided";
            res.status(401).send();
            return;
        }
        // check if token exists in database
        const user = await getOneFromToken(token);
        if (user.length === 0) {
            res.statusMessage = "Unauthorized: Invalid token";
            res.status(401).send();
            return;
        }
        // check if petition exists
        const ownerId = user[0].id;
        const petition = await petitionModel.getOne(petitionId);
        if (petition.length === 0) {
            res.statusMessage = "Not Found: Petition not found";
            res.status(404).send();
            return;
        }
        // check if owner is owner of petition
        if (petition[0].owner_id !== ownerId) {
            res.statusMessage = "Forbidden: You are not the owner of this petition";
            res.status(403).send();
            return;
        }
        // validate tierId
        const tierId = parseInt(req.params.tierId, 10);
        if (isNaN(tierId)) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
            return;
        }
        // check if tier exists
        const supportTier = await supportTiersModel.getSupportTier(tierId);
        if (supportTier.length === 0) {
            res.statusMessage = "Not Found: Support tier not found";
            res.status(404).send();
            return;
        }
        // check if title is unique
        let title = req.body.title;
        const tiers = await supportTiersModel.getPetitionSupportTiers(petitionId);
        for (const tier of tiers) {
            if (tier.title === title) {
                res.statusMessage = "Forbidden: Petition already has a support tier with this title";
                res.status(403).send();
                return;
            }
        }
        // check if no supporters have already supported this tier
        const supporters = await supportersModel.getNumSupportersFromTier(tierId);
        if (supporters > 0) {
            res.statusMessage = "Forbidden: Supporters have already supported this tier";
            res.status(403).send();
            return;
        }
        // update tier
        const description = req.body.description || supportTier[0].description;
        const cost = req.body.cost || supportTier[0].cost;
        title = req.body.title || supportTier[0].title;
        await supportTiersModel.updateTier(tierId, title, description, cost);
        res.statusMessage = "OK";
        res.status(200).send();


    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deleteSupportTier = async (req: Request, res: Response): Promise<void> => {
    try{
        /*
            things to validate:
            - petitionId, not NaN
            - petition exists
            - tierId, not NaN
            - tier exists
            - token, not null
            - token exists in database
            - user is owner of petition
            - no supporters have already supported this tier
            - tier is not the last tier
        */

        // validate petitionId
        const petitionId = parseInt(req.params.id, 10);
        if (isNaN(petitionId)) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
            return;
        }
        // check Authorization
        const token = req.header('X-Authorization');
        if (!token) {
            res.statusMessage = "Unauthorized: No token provided";
            res.status(401).send();
            return;
        }
        // check if token exists in database
        const user = await getOneFromToken(token);
        if (user.length === 0) {
            res.statusMessage = "Unauthorized: Invalid token";
            res.status(401).send();
            return;
        }
        // check if petition exists
        const ownerId = user[0].id;
        const pet = await petitionModel.getOne(petitionId);
        if (pet.length === 0) {
            res.statusMessage = "Not Found: Petition not found";
            res.status(404).send();
            return;
        }
        // check if owner is owner of petition
        if (pet[0].owner_id !== ownerId) {
            res.statusMessage = "Forbidden: You are not the owner of this petition";
            res.status(403).send();
            return;
        }
        // validate tierId
        const tierId = parseInt(req.params.tierId, 10);
        if (isNaN(tierId)) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
            return;
        }
        // check if tier exists
        const tier = await supportTiersModel.getSupportTier(tierId);
        if (tier.length === 0) {
            res.statusMessage = "Not Found: Support tier not found";
            res.status(404).send();
            return;
        }
        // check if no supporters have already supported this tier
        const supporters = await supportersModel.getNumSupportersFromTier(tierId);
        if (supporters > 0) {
            res.statusMessage = "Forbidden: Supporters have already supported this tier";
            res.status(403).send();
            return;
        }
        // check if tier is not the last tier
        const tiers = await supportTiersModel.getPetitionSupportTiers(petitionId);
        if (tiers.length <= 1) {
            res.statusMessage = "Forbidden: Can not remove a support tier if it is the only one for a petition";
            res.status(403).send();
            return;
        }
        // delete tier
        await supportTiersModel.deleteTier(tierId);

        res.statusMessage = "OK";
        res.status(200).send();

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {addSupportTier, editSupportTier, deleteSupportTier};