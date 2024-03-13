import Ajv from 'ajv';
import addformats from 'ajv-formats';
const ajv = new Ajv({removeAdditional: 'all', strict: false});
addformats(ajv);
ajv.addFormat('integer', {validate: /^-?[0-9]+$/});

const validate = async (schema: object, data: any) => {
    try {
        const validator = ajv.compile(schema);
        const valid = validator(data);
        if(!valid)
            return ajv.errorsText(validator.errors);
        return true;
    } catch (err) {
        return err.message;
    }
}

export default validate;