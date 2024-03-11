import {Request, Response} from "express";
import Logger from '../../config/logger';
import validate from '../services/validate';
import * as petitions from '../models/petitions.model';
import * as supporters from '../models/supporters.model';
import { getOneFromToken } from "../models/user.model";

import * as schemas from '../resources/schemas.json'

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {
    try{
        const schema = schemas.petition_search;
        const validation = await validate(schema, req.query);
        if(validation !== true){
            res.statusMessage = validation;
            res.status(400).send();
            return;
        }
        const startIndex = parseInt(req.query.startIndex as string || '0', 10);
        let count = parseInt(req.query.count as string || '-1', 10);
        const q = req.query.q as string;
        const categoryIds = (req.query.categoryIds as string[] || []).map(Number);
        const supportingCost = parseInt(req.query.supportingCost as string || '-1', 10);
        const ownerId = parseInt(req.query.ownerId as string || '-1', 10);
        const supporterId = parseInt(req.query.supporterId as string || '-1', 10);
        const sortBy = req.query.sortBy as string || 'CREATED_ASC';

        // test if numbers are numbers
        if (isNaN(startIndex) || isNaN(count) || isNaN(supportingCost) || isNaN(ownerId) || isNaN(supporterId)) {
            res.statusMessage = "Bad Request: Invalid number";
            res.status(400).send();
            return;
        }


        const result = await petitions.getAll(q, categoryIds, supportingCost, ownerId, supporterId, sortBy);


        res.statusMessage = "OK";
        const petitionJson = [];
        if (count === -1) {
            count = result.length;
        }
        for (let i = startIndex; i < startIndex + count; i++) {
            if (result[i]) {
                const petition = {
                    "petitionId": result[i].id,
                    "title": result[i].title,
                    "categoryId": result[i].category_id,
                    "ownerId": result[i].owner_id,
                    "ownerFirstName": result[i].first_name,
                    "ownerLastName": result[i].last_name,
                    "creationDate": result[i].creation_date,
                    "supportingCost": result[i].supporting_cost,
                    "numberOfSupporters": (await supporters.getNumSupporters(result[i].id)),
                }
                petitionJson.push(petition);
            }
        }
        const response = {
            "count": result.length,
            "petitions": petitionJson
        }
        res.status(200).send(response);

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const getPetition = async (req: Request, res: Response): Promise<void> => {
    try{

        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = "Bad Request: ID must be a number";
            res.status(400).send();
            return;
        }

        const petition = await petitions.getOne(id);
        if (petition.length === 0) {
            res.statusMessage = "Not Found: No petition with ID";
            res.status(404).send();
            return;
        }

        const supps = await supporters.getPetitionSupportTiers(id);

        const response = {
            "petitionId": petition[0].id,
            "title": petition[0].title,
            "categoryId": petition[0].category_id,
            "ownerId": petition[0].owner_id,
            "ownerFirstName": petition[0].first_name,
            "ownerLastName": petition[0].last_name,
            "number_of_supporters": (await supporters.getNumSupporters(id)),
            "createdDate": petition[0].creation_date,
            "description": petition[0].description,
            "money_raised": supps[0].money_raised,
            "supportTiers": {},
        }
        const supportTiers = [];
        for (const sup of supps) {
            supportTiers.push({
                "title": sup.title,
                "description": sup.description,
                "cost": sup.cost,
                "supportTierId": sup.id,
            });
        }
        response.supportTiers = supportTiers;

        res.statusMessage = "OK";
        res.status(200).send(response);

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addPetition = async (req: Request, res: Response): Promise<void> => {
    try{

        const schema = schemas.petition_post;
        const validation = await validate(schema, req.body);
        // validate the body
        if(validation !== true){
            res.statusMessage = validation;
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
        const user = await getOneFromToken(token);
        if (user.length === 0) {
            res.statusMessage = "Unauthorized: Invalid token";
            res.status(401).send();
            return;
        }
        const body = req.body;
        const supportTiers = body.supportTiers as {title: string, description: string, cost: number}[];
        // validate the support tiers
        if (supportTiers.length < 1 || supportTiers.length > 3) {
            res.statusMessage = "Bad Request: Invalid number of support tiers";
            res.status(400).send();
            return;
        }
        // validate the category ID
        const categoryIds = await petitions.getCategoryIds();

        if (categoryIds.map(e => e.id).indexOf(parseInt(body.categoryId, 10)) === -1) {
            res.statusMessage = "Bad Request: Invalid category ID";
            res.status(400).send();
            return;
        }
        // validate the title
        if ((await petitions.getPetitionTitles()).indexOf(body.title) !== -1) {
            res.statusMessage = "Bad Request: Title already exists";
            res.status(400).send();
            return;
        }
        // add the petition
        const petition = await petitions.insert(
            body.title,
            body.description,
            body.categoryId,
            user[0].id,
            body.imageFilename);

        // add the support tiers
        for (const tier of supportTiers) {
            await supporters.insertTier(petition.insertId, tier.title, tier.description, tier.cost);
        }
        res.statusMessage = "Created";
        res.status(201).send({"petitionId": petition.insertId});
        return;


    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const schema = schemas.petition_patch;
        const validation = await validate(schema, req.body);
        // validate the body
        if(validation !== true){
            res.statusMessage = validation;
            res.status(400).send();
            return;
        }
        const token = req.header('X-Authorization');
        if (!token) {
            res.statusMessage = "Unauthorized: No token provided";
            res.status(401).send();
            return;
        }
        const user = await getOneFromToken(token);
        if (user.length === 0) {
            res.statusMessage = "Unauthorized: Invalid token";
            res.status(401).send();
            return;
        }
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = "Bad Request: ID must be a number";
            res.status(400).send();
            return;
        }
        const petition = await petitions.getOne(id);
        if (petition.length === 0) {
            res.statusMessage = "Not Found: No petition with ID";
            res.status(404).send();
            return;
        }
        if (petition[0].owner_id !== user[0].id) {
            res.statusMessage = "Forbidden: User is not the owner of the petition";
            res.status(403).send();
            return;
        }
        const title = req.body.title || petition[0].title;
        const description = req.body.description || petition[0].description;
        const categoryId = req.body.categoryId || petition[0].category_id;
        await petitions.updatePetition(id, title, description, categoryId);

        res.statusMessage = "OK";
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deletePetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const token = req.header('X-Authorization');
        if (!token) {
            res.statusMessage = "Unauthorized: No token provided";
            res.status(401).send();
            return;
        }
        const user = await getOneFromToken(token);
        if (user.length === 0) {
            res.statusMessage = "Unauthorized: Invalid token";
            res.status(401).send();
            return;
        }
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.statusMessage = "Bad Request: ID must be a number";
            res.status(400).send();
            return;
        }
        const petition = await petitions.getOne(id);
        if (petition.length === 0) {
            res.statusMessage = "Not Found: No petition with ID";
            res.status(404).send();
            return;
        }
        if (petition[0].owner_id !== user[0].id) {
            res.statusMessage = "Forbidden: User is not the owner of the petition";
            res.status(403).send();
            return;
        }
        if (await supporters.getNumSupporters(id) > 0) {
            res.statusMessage = "Forbidden: Petition has supporters";
            res.status(403).send();
            return;
        }
        await petitions.deletePetition(id);
        res.statusMessage = "OK";
        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getCategories = async(req: Request, res: Response): Promise<void> => {
    try{

        const categories = await petitions.getCategoryIds();
        res.statusMessage = "OK";
        res.status(200).send(categories);

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories};