import Logger from "../../config/logger"

import * as bcrypt from 'bcryptjs'

const saltRounds = 10

const hash = async (password: string): Promise<string> => {
    // Todo: update this to encrypt the password
    const encryptedPassword = bcrypt.hashSync(password, saltRounds)
    return encryptedPassword
}

const compare = async (password: string, comp: string): Promise<boolean> => {
    // Todo: (suggested) update this to compare the encrypted passwords
    return bcrypt.compareSync(password, comp)
}



export {hash, compare}