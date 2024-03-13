import exp from "constants";
import {getPool} from "../../config/db";
import Logger from "../../config/logger";
import { ResultSetHeader } from 'mysql2'


const getNumSupporters = async (id: number): Promise<number> => {
    Logger.info(`Getting number of supporters from the database for petition ${id}`);
    const conn = await getPool().getConnection();
    const query = 'SELECT COUNT(supporter.id) AS number_of_supporters, ' +
                        'SUM(cost) AS money_raised, ' +
                        'MIN(cost) AS supporting_cost ' +
                        'FROM supporter JOIN support_tier ON supporter.support_tier_id=support_tier.id ' +
                        'WHERE supporter.petition_id = ? ' +
                        'GROUP BY supporter.petition_id';
    const [ rows ] = await conn.query( query, [id] );
    await conn.release();
    if (rows.length === 0) {
        return 0;
    }
    return rows[0].number_of_supporters;
}

const getNumSupportersFromTier = async (id: number): Promise<number> => {
    Logger.info(`Getting number of supporters from the database for petition ${id}`);
    const conn = await getPool().getConnection();
    const query = 'SELECT COUNT(supporter.id) AS number_of_supporters ' +
                        'FROM supporter JOIN support_tier ON supporter.support_tier_id=support_tier.id ' +
                        'WHERE support_tier.id = ? '
    const [ rows ] = await conn.query( query, [id] );
    await conn.release();
    if (rows.length === 0) {
        return 0;
    }
    return rows[0].number_of_supporters;
}

const getAllSupportersForPetition = async (id: number): Promise<Supporter[]> => {
    Logger.info(`Getting all supporters from the database for petition ${id}`);
    const conn = await getPool().getConnection();
    const query = `SELECT ` +
                'supporter.id, ' +
                'supporter.support_tier_id, ' +
                'supporter.message, ' +
                'supporter.user_id, ' +
                'user.first_name, ' +
                'user.last_name, ' +
                'supporter.timestamp ' +
                'FROM supporter JOIN support_tier ON supporter.support_tier_id=support_tier.id ' +
                'JOIN user ON supporter.user_id=user.id ' +
                'WHERE supporter.petition_id = ? ' +
                'ORDER BY supporter.timestamp DESC';
    const [ rows ] = await conn.query( query, [id] );
    await conn.release();
    return rows;
}

const getAllSupportersForTier = async (id: number): Promise<Supporter[]> => {
    Logger.info(`Getting all supporters from the database for tier ${id}`);
    const conn = await getPool().getConnection();
    const query = `SELECT ` +
                'supporter.id, ' +
                'support_tier_id, ' +
                'message, ' +
                'user_id, ' +
                'user.first_name, ' +
                'user.last_name, ' +
                'timestamp ' +
                'FROM supporter JOIN user ON supporter.user_id=user.id ' +
                'WHERE support_tier_id = ? '
    const [ rows ] = await conn.query( query, [id] );
    await conn.release();
    return rows;
}

const insertSupporter = async (petitionId: number, supportTierId: number, userId: number, message: string): Promise<ResultSetHeader> => {
    Logger.info(`Inserting supporter for petition ${petitionId} into the database`);
    const conn = await getPool().getConnection();
    const query = 'INSERT into supporter (petition_id, support_tier_id, user_id, message) VALUES (?, ?, ?, ?)';
    const [ result ] = await conn.query( query, [petitionId, supportTierId, userId, message] );
    await conn.release();
    return result;
}

export {getNumSupporters, getNumSupportersFromTier, getAllSupportersForPetition, getAllSupportersForTier, insertSupporter};