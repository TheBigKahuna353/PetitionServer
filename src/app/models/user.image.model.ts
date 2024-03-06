import e from "express";
import {getPool} from "../../config/db";
import Logger from "../../config/logger";
import { ResultSetHeader } from 'mysql2'


const get = async (userId: number): Promise<UserImage[]> => {
    Logger.info(`Getting image for user with id ${userId} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT image_filename FROM user WHERE id = ?';
    const [ rows ] = await conn.query( query, [userId] );
    await conn.release();
    return rows;
}

const getTokenAndImage = async (userId: number): Promise<UserImage[]> => {
    Logger.info(`Getting token for user with id ${userId} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT auth_token, image_filename FROM user WHERE id = ?';
    const [ rows ] = await conn.query( query, [userId] );
    await conn.release();
    return rows;
}

const save = async (userId: number, filename: string): Promise<ResultSetHeader> => {
    Logger.info(`Saving image for user with id ${userId} to the database`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET image_filename = ? WHERE id = ?';
    const [ result ] = await conn.query( query, [filename, userId] );
    await conn.release();
    return result;
}

const remove = async (userId: number): Promise<ResultSetHeader> => {
    Logger.info(`Removing image for user with id ${userId} from the database`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET image_filename = NULL WHERE id = ?';
    const [ result ] = await conn.query( query, [userId] );
    await conn.release();
    return result;
}

export {get, getTokenAndImage, save, remove}