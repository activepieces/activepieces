import { ActionBase, PieceMetadataModelSummary, TriggerBase } from "./piece-metadata"

import { PieceMetadataModel } from "./piece-metadata"
import { CustomAuthProperty, CustomAuthProps, InputPropertyMap, PieceAuthProperty, PieceProperty, PropertyType } from "./property"
import { Piece } from "./piece"
import { Action } from "./action/action"
import { Trigger } from "./trigger/trigger"
import { isNil, LocalesEnum } from "@activepieces/shared"

const fetchI18nForActionOrTrigger = (source: Action<PieceAuthProperty, InputPropertyMap> | Trigger<PieceAuthProperty, InputPropertyMap>) => {
    const i18n:Record<string, string> = {}
  
    if(source.displayName) {
      i18n[source.displayName] = source.displayName
    }
  
    if(source.description) {
      i18n[source.description] = source.description
    }
  
  
    Object.values(source.props).forEach((prop) => {
      if(prop.displayName) {
        i18n[prop.displayName] = prop.displayName
      }
      if(prop.description) {
        i18n[prop.description] = prop.description
      }
      switch(prop.type) {
        case PropertyType.STATIC_DROPDOWN:
        case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
          {
            if(prop.options) {
             prop.options.options.forEach((option) => {
              if(option.label) {
                i18n[option.label] = option.label
              }
             })
            }
            break;
          }
          case PropertyType.MARKDOWN:
           {
            if(prop.description) {
              i18n[prop.description] = prop.description
            }
            break;
           }
       }
    })
    return i18n
   
  
  }
  
  export const generateI18n = ({actions, triggers, description,displayName, auth}:  Piece<PieceAuthProperty>) => {
    let i18n:Record<string, string> = {}
    i18n[displayName] = displayName
    i18n[description] = description
    if(auth) {
      if(auth.displayName) {
        i18n[auth.displayName] = auth.displayName
      }
      if(auth.description) {
        i18n[auth.description] = auth.description
      }
      switch(auth.type) {
        case PropertyType.OAUTH2:{
          if(auth.props){
            Object.values(auth.props).forEach((prop) => {
              if(prop.displayName) {
                i18n[prop.displayName] = prop.displayName
              }
              if(prop.description) {
                i18n[prop.description] = prop.description
              }
            })
          }
          break;
        }
        case PropertyType.SECRET_TEXT: {
          break;
        }
        case PropertyType.BASIC_AUTH :{
          if(auth.username.displayName) {
            i18n[auth.username.displayName] = auth.username.displayName
          }
          if(auth.username.description) {
            i18n[auth.username.description] = auth.username.description
          }
          if(auth.password.displayName) {
            i18n[auth.password.displayName] = auth.password.displayName
          }
          if(auth.password.description) {
            i18n[auth.password.description] = auth.password.description
          }
          break;
        }
        case PropertyType.CUSTOM_AUTH: {
           Object.values((auth as CustomAuthProperty<CustomAuthProps>).props ).forEach((prop) => {
            if(prop.displayName) {
              i18n[prop.displayName] = prop.displayName
            }
            if(prop.description) {
              i18n[prop.description] = prop.description
            }
          })
          break;
        }
      }
    }
  
    Object.values(actions).forEach((action) => {
      i18n = {...i18n, ...fetchI18nForActionOrTrigger(action)}
    })
  
    Object.values(triggers).forEach((trigger) => {
      i18n = {...i18n, ...fetchI18nForActionOrTrigger(trigger)}
    })
    
    return i18n
   }
  
   const fetchTranslationFromI18n = (i18n: Record<string, string>, key: string) => {
    if(!i18n[key]) {
      return key
    }
    return i18n[key]
   }
   const translateActionOrTrigger  = <T extends ActionBase | TriggerBase>(source: T, i18n: Record<string, string>): T => {
    const translatedActionOrTrigger: T = JSON.parse(JSON.stringify(source))
    translatedActionOrTrigger.displayName = fetchTranslationFromI18n(i18n, source.displayName)
    translatedActionOrTrigger.description = fetchTranslationFromI18n(i18n, source.description)
    translatedActionOrTrigger.props = Object.fromEntries(Object.entries(source.props).map(([key, prop]) => {
      const translatedProp: PieceProperty = JSON.parse(JSON.stringify(prop))
      translatedProp.displayName = fetchTranslationFromI18n(i18n, prop.displayName)
      if(prop.description) {
        translatedProp.description = fetchTranslationFromI18n(i18n, prop.description)
      }
      switch(translatedProp.type) {
        case PropertyType.STATIC_DROPDOWN:
        case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
          {
            translatedProp.options.options = translatedProp.options.options.map((option) => ({...option, label: fetchTranslationFromI18n(i18n, option.label)}))
            break;
          }
        case PropertyType.MARKDOWN:
          {
            if(translatedProp.description) {
              translatedProp.description = fetchTranslationFromI18n(i18n, translatedProp.description)
            }
          }
          break;
      }
      return [key, translatedProp]
    }))
    return translatedActionOrTrigger
   }
  
   const translateAuth = (auth: PieceAuthProperty, i18n: Record<string, string>) => {
    const translatedAuth: PieceAuthProperty = JSON.parse(JSON.stringify(auth))
    translatedAuth.displayName = fetchTranslationFromI18n(i18n, auth.displayName)
    if(auth.description) {
    translatedAuth.description = fetchTranslationFromI18n(i18n, auth.description)
    }
    switch(translatedAuth.type) {
      case PropertyType.OAUTH2:
      {
        if(translatedAuth.props) {
          translatedAuth.props = Object.fromEntries(Object.entries(translatedAuth.props).map(([key, prop]) => {
           const translatedProp = {
            ...prop,
            displayName: fetchTranslationFromI18n(i18n, prop.displayName),
            description: prop.description ? fetchTranslationFromI18n(i18n, prop.description) : undefined
           }
           return [key, translatedProp]
          }))
        }
        break;
      }
      case PropertyType.SECRET_TEXT:
        {
          break;
        }
      case PropertyType.BASIC_AUTH:
        {
            translatedAuth.username.displayName = fetchTranslationFromI18n(i18n, translatedAuth.username.displayName)
            translatedAuth.username.description = translatedAuth.username.description ? fetchTranslationFromI18n(i18n, translatedAuth.username.description) : undefined
            translatedAuth.password.displayName = fetchTranslationFromI18n(i18n, translatedAuth.password.displayName)
            translatedAuth.password.description = translatedAuth.password.description ? fetchTranslationFromI18n(i18n, translatedAuth.password.description) : undefined
            break;
        }
      case PropertyType.CUSTOM_AUTH:
        {
          translatedAuth.props = Object.fromEntries(Object.entries((translatedAuth as CustomAuthProperty<CustomAuthProps>).props).map(([key, prop]) => {
            const translatedProp = {
              ...prop,
              displayName: fetchTranslationFromI18n(i18n, prop.displayName),
              description: prop.description ? fetchTranslationFromI18n(i18n, prop.description) : undefined
            }
            return [key, translatedProp]
          }))
          break;
        }
    }
    return translatedAuth
   }
   export const translatePiece =<T extends PieceMetadataModelSummary | PieceMetadataModel>(piece: T, locale: LocalesEnum): T => {
        if(isNil(piece.i18n)) {
          return piece
        }
        const i18n = piece.i18n[locale]
        if(!i18n) {
          return piece;
        }
        const translatedPiece:  PieceMetadataModelSummary | PieceMetadataModel = JSON.parse(JSON.stringify(piece))
        translatedPiece.displayName = fetchTranslationFromI18n(i18n, piece.displayName)
        translatedPiece.description = fetchTranslationFromI18n(i18n, piece.description)
        if(typeof translatedPiece.actions === 'object') {
         translatedPiece.actions = Object.fromEntries(Object.entries(translatedPiece.actions).map(([key, action]) => [key, translateActionOrTrigger(action, i18n)]))
        }
        if(typeof translatedPiece.triggers === 'object') {
          translatedPiece.triggers = Object.fromEntries(Object.entries(translatedPiece.triggers).map(([key, trigger]) => [key, translateActionOrTrigger(trigger, i18n)]))
        }
        if(translatedPiece.auth)
        {
          translatedPiece.auth = translateAuth(translatedPiece.auth, i18n)
        }
        return translatedPiece as T
   }