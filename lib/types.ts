export interface Program {
    id: string
    name: string
    slug: string
    description?: string
    instagram_mokin_url?: string
    instagram_mokin_label?: string
    instagram_gajeto_url?: string
    instagram_gajeto_label?: string
    created_at: string
}

export interface StoreData {
    id: string
    name: string
    slug: string
    location?: string
    program_id: string
}

export interface RedemptionRow {
    id: number
    store_id: string
    program_id: string
    name?: string
    email: string
    phone: string
    created_at: string
    store_name?: string
}
