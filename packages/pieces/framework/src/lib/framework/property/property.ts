import { PropertyType } from "@activepieces/shared";
import {
	ArrayProperty,
	CheckboxProperty,
	JsonProperty,
	LongTextProperty,
	NumberProperty,
	ObjectProperty,
	SecretTextProperty,
	ShortTextProperty,
} from "./base-prop";
import { BasicAuthProperty } from "./basic-auth-prop";
import { DropdownProperty, StaticDropdownProperty } from "./dropdown-prop";
import { OAuth2Property } from "./oauth2-prop";

export interface PieceProperty {
	[name: string]: ShortTextProperty<boolean>
	| LongTextProperty<boolean>
	| OAuth2Property<boolean>
	| CheckboxProperty<boolean>
	| DropdownProperty<any, boolean>
	| StaticDropdownProperty<any, boolean>
	| NumberProperty<boolean>
	| SecretTextProperty<boolean>
	| BasicAuthProperty<boolean>
	| ArrayProperty<boolean>
	| ObjectProperty<boolean>
	| JsonProperty<boolean>;
}

export type StaticPropsValue<T extends PieceProperty> = {
	[P in keyof T]: T[P] extends { required: true } ? T[P]['valueSchema'] : T[P]['valueSchema'] | undefined;
}

export const Property = {
	ShortText<R extends boolean>(request: Properties<ShortTextProperty<R>>): R extends true ? ShortTextProperty<true> : ShortTextProperty<false> {
		return { ...request, valueSchema: undefined, type: PropertyType.SHORT_TEXT } as unknown as R extends true ? ShortTextProperty<true> : ShortTextProperty<false>;
	},
	Checkbox<R extends boolean>(request: Properties<CheckboxProperty<R>>): R extends true ? CheckboxProperty<true> : CheckboxProperty<false> {
		return { ...request, valueSchema: undefined, type: PropertyType.CHECKBOX } as unknown as R extends true ? CheckboxProperty<true> : CheckboxProperty<false>;
	},
	LongText<R extends boolean>(request: Properties<LongTextProperty<R>>): R extends true ? LongTextProperty<true> : LongTextProperty<false> {
		return { ...request, valueSchema: undefined, type: PropertyType.SHORT_TEXT } as unknown as R extends true ? LongTextProperty<true> : LongTextProperty<false>;
	},
	Number<R extends boolean>(request: Properties<NumberProperty<R>>): R extends true ? NumberProperty<true> : NumberProperty<false> {
		return { ...request, valueSchema: undefined, type: PropertyType.NUMBER } as unknown as R extends true ? NumberProperty<true> : NumberProperty<false>;
	},
	Json<R extends boolean>(request: Properties<JsonProperty<R>>): R extends true ? JsonProperty<true> : JsonProperty<false> {
		return { ...request, valueSchema: undefined, type: PropertyType.JSON } as unknown as R extends true ? JsonProperty<true> : JsonProperty<false>;
	},
	Array<R extends boolean>(request: Properties<ArrayProperty<R>>): R extends true ? ArrayProperty<true> : ArrayProperty<false> {
		return { ...request, valueSchema: undefined, type: PropertyType.ARRAY } as unknown as R extends true ? ArrayProperty<true> : ArrayProperty<false>;
	},
	Object<R extends boolean>(request: Properties<ObjectProperty<R>>): R extends true ? ObjectProperty<true> : ObjectProperty<false> {
		return { ...request, valueSchema: undefined, type: PropertyType.OBJECT } as unknown as R extends true ? ObjectProperty<true> : ObjectProperty<false>;
	},
	SecretText<R extends boolean>(request: Properties<SecretTextProperty<R>>): R extends true ? SecretTextProperty<true> : SecretTextProperty<false> {
		return { ...request, valueSchema: undefined, type: PropertyType.SECRET_TEXT } as unknown as R extends true ? SecretTextProperty<true> : SecretTextProperty<false>;
	},
	BasicAuth<R extends boolean>(request: Properties<BasicAuthProperty<R>>): R extends true ? BasicAuthProperty<true> : BasicAuthProperty<false> {
		return { ...request, valueSchema: undefined, type: PropertyType.BASIC_AUTH } as unknown as R extends true ? BasicAuthProperty<true> : BasicAuthProperty<false>;
	},
	OAuth2<R extends boolean>(request: Properties<OAuth2Property<R>>): R extends true ? OAuth2Property<true> : OAuth2Property<false> {
		return { ...request, valueSchema: undefined, type: PropertyType.OAUTH2 } as unknown as R extends true ? OAuth2Property<true> : OAuth2Property<false>;
	},
	Dropdown<T, R extends boolean = boolean>(request: Properties<DropdownProperty<T, R>>): R extends true ? DropdownProperty<T, true> : DropdownProperty<T, false> {
		return { ...request, valueSchema: undefined, type: PropertyType.DROPDOWN } as unknown as R extends true ? DropdownProperty<T, true> : DropdownProperty<T, false>;
	},
	StaticDropdown<T, R extends boolean = boolean>(request: Properties<StaticDropdownProperty<T, R>>): R extends true ? StaticDropdownProperty<T, true> : StaticDropdownProperty<T, false> {
		return { ...request, valueSchema: undefined, type: PropertyType.STATIC_DROPDOWN } as unknown as R extends true ? StaticDropdownProperty<T, true> : StaticDropdownProperty<T, false>;
	}
};

type Properties<T> = Omit<T, "valueSchema" | "type">;