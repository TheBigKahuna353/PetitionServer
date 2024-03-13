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

type PetitionSupportTier = {

    title: string,

    description: string,

    petition_id: number,

    id: number,

    cost: number,

}

type PetitionTitles = {
    
    title: string,
    
}

type PetitionSupportTierStats = {

    cost: number,

    money_raised: number,

}

type catergoryId = {
    
    id: number,

    name: string,
    
}

type Supporter = {

    id: number,

    support_tier_id: number,

    first_name: string,

    last_name: string,

    user_id: number,

    message: string,

    timestamp: string

}