import {getPool} from "../../config/db";
import Logger from "../../config/logger";
import { ResultSetHeader } from 'mysql2'

const insert = async (email: string, fistName: string, lastName: string, password: string): Promise<ResultSetHeader> => {
    Logger.info(`Inserting user with email ${email} into the database`);
    const conn = await getPool().getConnection();
    const query = 'INSERT into user (email, first_name, last_name, password) VALUES (?, ?, ?, ?)';
    const [ result ] = await conn.query( query, [email, fistName, lastName, password] );
    await conn.release();
    return result;
}

const userLogin = async (email: string, password: string): Promise<User[]> => {
    Logger.info(`Getting user with email ${email} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM user WHERE email = ? AND password = ?';
    const [ rows ] = await conn.query( query, [email, password] );
    await conn.release();
    return rows;
}

const updateToken = async (id: number, token: string): Promise<ResultSetHeader> => {
    Logger.info(`Inserting token for user with id ${id} into the database`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET auth_token = ? WHERE id = ?';
    const [ result ] = await conn.query( query, [token, id] );
    await conn.release();
    return result;
}

const removeToken = async (token: string): Promise<ResultSetHeader> => {
    Logger.info(`Removing token from the database`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET auth_token = NULL WHERE auth_token = ?';
    const [ result ] = await conn.query( query, [token] );
    await conn.release();
    return result;
}

const getOne = async (id: number): Promise<User[]> => {
    Logger.info(`Getting user with id ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM user WHERE id = ?';
    const [ rows ] = await conn.query( query, [id] );
    await conn.release();
    return rows;
}

const update = async (email: string, firstName: string, lastName: string, password: string, id: number): Promise<ResultSetHeader> => {
    Logger.info(`Updating user with id ${id} in the database`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET email = ?, first_name = ?, last_name = ?, password = ? WHERE id = ?';
    const [ result ] = await conn.query( query, [email, firstName, lastName, password, id] );
    await conn.release();
    return result;
}

export { insert, userLogin, updateToken, removeToken, getOne, update }