import EDITION from '../edition.json'

export const runtime = { use24: !!EDITION.h24, userName: EDITION.name }
