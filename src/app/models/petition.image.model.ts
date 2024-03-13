import exp from "constants";
import {getPool} from "../../config/db";
import Logger from "../../config/logger";
import { ResultSetHeader } from 'mysql2'

const getImage = async (petitionId: number): Promise<PetitionImage[]> => {
    Logger.info(`Getting image for petition with id ${petitionId} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT image_filename ' +
                    'FROM petition WHERE id = ?';
    const [ rows ] = await conn.query( query, [petitionId] );
    await conn.release();
    return rows;
}

const getImageAndToken = async (petitionId: number): Promise<PetitionImage[]> => {
    Logger.info(`Getting image for petition with id ${petitionId} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT petition.image_filename, auth_token ' +
                    'FROM petition JOIN user ON user.id=owner_id WHERE petition.id = ?';
    const [ rows ] = await conn.query( query, [petitionId] );
    await conn.release();
    return rows;
}

const save = async (petitionId: number, filename: string): Promise<ResultSetHeader> => {
    Logger.info(`Saving image for petition with id ${petitionId} to the database`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE petition SET image_filename = ? WHERE id = ?';
    const [ result ] = await conn.query( query, [filename, petitionId] );
    await conn.release();
    return result;
}


export {getImage, getImageAndToken, save};