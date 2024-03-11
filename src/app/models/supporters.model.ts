import exp from "constants";
import {getPool} from "../../config/db";
import Logger from "../../config/logger";
import { ResultSetHeader } from 'mysql2'


const getPetitionSupportTiers = async (id: number): Promise<PetitionSupportTier[]> => {
    Logger.info(`Getting petition supporters from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT title, description, MIN(cost) as cost, id, SUM(cost) as money_raised FROM support_tier WHERE petition_id = ?';
    const [ rows ] = await conn.query( query, [id] );
    await conn.release();
    return rows;
}

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

const insertTier = async (petitionId: number, title: string, description: string, cost: number): Promise<ResultSetHeader> => {
    Logger.info(`Inserting support tier for petition ${petitionId} into the database`);
    const conn = await getPool().getConnection();
    const query = 'INSERT into support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ?)';
    const [ result ] = await conn.query( query, [petitionId, title, description, cost] );
    await conn.release();
    return result;
}

export {getPetitionSupportTiers, getNumSupporters, insertTier};