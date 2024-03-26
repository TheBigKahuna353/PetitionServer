import exp from "constants";
import {getPool} from "../../config/db";
import Logger from "../../config/logger";
import { ResultSetHeader } from 'mysql2'

// helper function to convert the sortBy string to SQL
const sortBySQL = (sortBy: string): string => {
    switch (sortBy) {
        case 'ALPHABETICAL_ASC':
            return 'ORDER BY title ASC';
        case 'ALPHABETICAL_DESC':
            return 'ORDER BY title DESC';
        case 'COST_ASC':
            return 'ORDER BY supporting_cost ASC, petition.id ASC';
        case 'COST_DESC':
            return 'ORDER BY supporting_cost DESC, petition.id ASC';
        case 'CREATED_ASC':
            return 'ORDER BY creation_date ASC, petition.id ASC';
        case 'CREATED_DESC':
            return 'ORDER BY creation_date DESC, petition.id ASC';
        default:
            return '';
    }
}

const getAll = async (q: string | string[], categoryId: string[], supportingCost: number, ownerId: number, supporterId: number, sortBy: string): Promise<Petition[]> => {
    Logger.info(`Getting petitions from the database`);
    const conn = await getPool().getConnection();
    let query = 'SELECT petition.id, category_id, owner_id, first_name, last_name, creation_date, petition.title, MIN(cost) AS supporting_cost FROM petition ' +
                    'JOIN user ON owner_id=user.id ' +
                    'JOIN supporter ON petition.id=supporter.petition_id ' +
                    'JOIN category ON category_id=category.id ' +
                    'JOIN support_tier ON support_tier.petition_id=petition.id ' +
                    'WHERE ';
    if (q) {
        query += `(petition.title LIKE '%${q}%' OR petition.description LIKE '%${q}%') AND `;
    }
    if (categoryId.length > 0) {
        query += `category_id IN (${categoryId.join()}) AND `;
    }
    if (ownerId !== -1) {
        query += `owner_id=${ownerId} AND `;
    }
    if (supporterId !== -1) {
        query += `supporter.user_id=${supporterId} AND `;
    }
    if (query.endsWith('AND ')) {
        query = query.slice(0, -5);
    }
    if (query.endsWith('WHERE ')) {
        query = query.slice(0, -6);
    }
    query += ' GROUP BY petition.id ';
    if (supportingCost !== -1) {
        query += 'HAVING MIN(support_tier.cost) <= ' + supportingCost + ' ';
    }
    query += sortBySQL(sortBy);
    const [ rows ] = await conn.query( query );
    await conn.release();
    return rows;
}

const getOne = async (id: number): Promise<Petition[]> => {
    Logger.info(`Getting petition ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT petition.id, category_id, owner_id, first_name, last_name, creation_date, petition.title, petition.description FROM petition ' +
                    'JOIN user ON owner_id=user.id ' +
                    'WHERE petition.id = ?';
    const [ rows ] = await conn.query( query, [id] );
    await conn.release();
    return rows;
}

const insert = async ( title: string, description: string, categoryId: number, ownerId: number, imageFilename: string): Promise<ResultSetHeader> => {
    Logger.info(`Inserting petition into the database`);
    const conn = await getPool().getConnection();
    const query = 'INSERT INTO petition (title, description, category_id, owner_id, image_filename, creation_date) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)';
    const [ result ] = await conn.query( query, [title, description, categoryId, ownerId, imageFilename] );
    await conn.release();
    return result;
}


const getCategoryIds = async (): Promise<catergoryId[]> => {
    Logger.info(`Getting categories from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT id, name FROM category';
    const [ rows ] = await conn.query( query );
    await conn.release();
    return rows;
}

const getPetitionTitles = async (): Promise<PetitionTitles[]> => {
    Logger.info(`Getting petition titles from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT title FROM petition';
    const [ rows ] = await conn.query( query );
    await conn.release();
    return rows;
}

const updatePetition = async (id: number, title: string, description: string, categoryId: number): Promise<ResultSetHeader> => {
    Logger.info(`Updating petition ${id} in the database`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE petition SET title=?, description=?, category_id=? WHERE id=?';
    const [ result ] = await conn.query( query, [title, description, categoryId, id] );
    await conn.release();
    return result;
}

const deletePetition = async (id: number): Promise<ResultSetHeader> => {
    Logger.info(`Deleting petition ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'DELETE FROM petition WHERE id=?';
    const [ result ] = await conn.query( query, [id] );
    await conn.release();
    return result;
}

export {getAll, getOne, insert, getCategoryIds, getPetitionTitles, updatePetition, deletePetition};