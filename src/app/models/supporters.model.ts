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



export {getNumSupporters, getNumSupportersFromTier};