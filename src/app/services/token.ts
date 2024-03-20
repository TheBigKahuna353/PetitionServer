import { uid } from 'rand-token';

const createToken = async (): Promise<string> => {
    return uid(16);
}

export default createToken;