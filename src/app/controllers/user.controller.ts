import {Request, Response} from "express";
import Logger from '../../config/logger';
import validate from '../services/validate';
import createToken from "../services/token";
import * as users from '../models/user.model';

import * as schemas from '../resources/schemas.json'

const register = async (req: Request, res: Response): Promise<void> => {
    try{

        const schema = schemas.user_register;
        const validation = await validate(schema, req.body);

        if(validation !== true){
            res.statusMessage = validation;
            res.status(400).send();
            return;
        }

        const {email, firstName, lastName, password} = req.body;

        const result = await users.insert(email, firstName, lastName, password);

        res.status(201).send({"userId": result.insertId});


    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.statusMessage = "Email already in use";
            res.status(403).send();
            return;
        }
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    try{
        const schema = schemas.user_login;
        const validation = await validate(schema, req.body);

        if(validation !== true){
            res.statusMessage = validation;
            res.status(400).send();
            return;
        }

        const {email, password} = req.body;

        const user = await users.userLogin(email, password);

        if(user.length === 0){
            res.statusMessage = "Unauthorized: Incorrect email/password";
            res.status(401).send();
            return;
        }
        const token = await createToken();
        const userId = user[0].id;
        await users.updateToken(userId, token);
        res.status(200).send({"userId": userId,"token": token});
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    try{

        const token = req.header('X-Authorization');

        const result = await users.removeToken(token);

        if(result.affectedRows === 0){
            res.statusMessage = "Unauthorized: Cannot log out if you are not authenticated";
            res.status(401).send();
            return;
        }

        res.status(200).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = parseInt(req.params.id, 10);
        const token = req.header('X-Authorization');

        if (isNaN(id)) {
            res.statusMessage = "Bad Request: ID must be a number";
            res.status(400).send();
            return;
        }

        const user = await users.getOne(id);

        if (user.length === 0) {
            res.statusMessage = "Not Found: No user with specified ID";
            res.status(404).send();
            return;
        }
        
        if(user[0].auth_token === token){

            res.status(200).send({"first_name": user[0].first_name,
                                    "last_name": user[0].last_name,
                                    "email": user[0].email});
            return;
        }
        res.status(200).send({"first_name": user[0].first_name,
                                "last_name": user[0].last_name});
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const update = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {register, login, logout, view, update}