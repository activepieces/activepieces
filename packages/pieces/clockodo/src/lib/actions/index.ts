import customerActions from './customer'
import projectActions from './project'
import serviceActions from './service'
import userActions from './user'

export default [
    ...customerActions,
    ...projectActions,
    ...serviceActions,
    ...userActions
]