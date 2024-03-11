type User = {
    
    id: number,

    email: string,

    first_name: string,

    last_name: string,

    image_filename: string,

    password: string,

    auth_token: string,

}

type UserImage = {

    image_filename: string,

    auth_token: string,

}

type Petition = {

    id: number,

    title: string,

    category_id: number,

    owner_id: number,

    first_name: string,

    last_name: string,

    creation_date: string,

    description: string,

    image_filename: string,

    supporting_cost: number,

}

type PetitionSupporters = {

    number_of_supporters: number

}

type PetitionSupportTier = {

    title: string,

    description: string,

    cost: number,

    id: number,

    money_raised: number,

}