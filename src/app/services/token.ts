const createToken = async (): Promise<string> => {
    return Math.random().toString(36);
}

export default createToken;