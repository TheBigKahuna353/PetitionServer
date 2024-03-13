import exp from "constants";
import {getPool} from "../../config/db";
import Logger from "../../config/logger";
import { ResultSetHeader } from 'mysql2'

const getPetitionSupportTiers = async (id: number): Promise<PetitionSupportTier[]> => {
    Logger.info(`Getting petition supporters tiers from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT title, description, id, cost, petition_id FROM support_tier WHERE petition_id = ?';
    const [ rows ] = await conn.query( query, [id] );
    await conn.release();
    return rows;
}

const getSupportTier = async (id: number): Promise<PetitionSupportTier[]> => {
    Logger.info(`Getting petition supporters tiers from the database for tier ${id}`);
    const conn = await getPool().getConnection();
    const query = 'SELECT title, description, cost, petition_id FROM support_tier WHERE id = ?';
    const [ rows ] = await conn.query( query, [id] );
    await conn.release();
    return rows;
}

const getSupportTierStats = async (id: number): Promise<PetitionSupportTierStats> => {
    Logger.info(`Getting petition supporters tiers stats from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT MIN(cost) as cost, SUM(cost) as money_raised FROM support_tier WHERE petition_id = ?';
    const [ rows ] = await conn.query( query, [id] );
    await conn.release();
    return rows[0];
}

const insertTier = async (petitionId: number, title: string, description: string, cost: number): Promise<ResultSetHeader> => {
    Logger.info(`Inserting support tier for petition ${petitionId} into the database`);
    const conn = await getPool().getConnection();
    const query = 'INSERT into support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ?)';
    const [ result ] = await conn.query( query, [petitionId, title, description, cost] );
    await conn.release();
    return result;
}

const updateTier = async (id: number, title: string, description: string, cost: number): Promise<ResultSetHeader> => {
    Logger.info(`Updating support tier ${id} in the database`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE support_tier SET title = ?, description = ?, cost = ? WHERE id = ?';
    const [ result ] = await conn.query( query, [title, description, cost, id] );
    await conn.release();
    return result;
}

const deleteTier = async (id: number): Promise<ResultSetHeader> => {
    Logger.info(`Deleting support tier ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'DELETE FROM support_tier WHERE id = ?';
    const [ result ] = await conn.query( query, [id] );
    await conn.release();
    return result;
}



export {getPetitionSupportTiers, getSupportTier, getSupportTierStats, insertTier, updateTier, deleteTier};