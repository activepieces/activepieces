import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static } from '@sinclair/typebox';
import { SquareFunction } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { ApMarkdown } from '@/components/custom/markdown';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrayInput } from '@/components/ui/array-input';
import { Button } from '@/components/ui/button';
import { DictionaryInput } from '@/components/ui/dictionary-input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  PieceAuthProperty,
  PieceProperty,
  PiecePropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';

import { formUtils } from '../lib/form-utils';

import { ReadMoreDescription } from './read-more-description';

type AutoFormProps = {
  props: PiecePropertyMap;
  auth: PieceAuthProperty | undefined;
};

const AutoFormComponent = ({ props, auth }: AutoFormProps) => {
  const FormSchema = formUtils.buildSchema({ props, auth });
  const form = useForm<Static<typeof FormSchema>>({
    resolver: typeboxResolver(FormSchema),
    defaultValues: {},
  });

  return (
    <Form {...form}>
      <form className="flex flex-col gap-3">
        {Object.entries(FormSchema.properties).map(([key]) => {
          return (
            <FormField
              name={key}
              control={form.control}
              key={key}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  {selectRightComponent(field, key, props[key])}
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}
      </form>
    </Form>
  );
};

const selectRightComponent = (
  field: any,
  key: string,
  property: PieceProperty,
) => {
  switch (property.type) {
    case PropertyType.ARRAY:
      return (
        <>
          <FormLabel htmlFor={key} className="flex items-center">
            <span>{property.displayName}</span>
            <span className="grow"></span>
            <Button
              variant={'ghost'}
              size={'sm'}
              className="inline-flex"
              onClick={(e) => e.preventDefault()}
            >
              <SquareFunction />
            </Button>
          </FormLabel>
          {property.description && (
            <ReadMoreDescription text={property.description} />
          )}
          <ArrayInput items={[]} onChange={(items) => {}}></ArrayInput>
        </>
      );
    case PropertyType.CHECKBOX:
      return (
        <>
          <FormLabel htmlFor={key} className="flex items-center justify-center">
            <FormControl>
              <Switch
                id={key}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <span className="ml-3 grow">{property.displayName}</span>
            <Button
              variant={'ghost'}
              size={'sm'}
              className="inline-flex"
              onClick={(e) => e.preventDefault()}
            >
              <SquareFunction />
            </Button>
          </FormLabel>
          {property.description && (
            <ReadMoreDescription text={property.description} />
          )}
        </>
      );
    case PropertyType.MARKDOWN:
      return (
        <Alert>
          <AlertDescription>
            <ApMarkdown markdown={property.description} />
          </AlertDescription>
        </Alert>
      );
    case PropertyType.OBJECT:
      return (
        <>
          <FormLabel htmlFor={key} className="flex items-center">
            <span>{property.displayName}</span>
            <span className="grow"></span>
            <Button
              variant={'ghost'}
              size={'sm'}
              className="inline-flex"
              onClick={(e) => e.preventDefault()}
            >
              <SquareFunction />
            </Button>
          </FormLabel>
          {property.description && (
            <ReadMoreDescription text={property.description} />
          )}
          <DictionaryInput values={[]} onChange={() => {}}></DictionaryInput>
        </>
      );
    case PropertyType.STATIC_DROPDOWN:
      return (
        <>
          <FormLabel htmlFor={key} className="flex items-center">
            <span>{property.displayName}</span>
            <span className="grow"></span>
            <Button
              variant={'ghost'}
              size={'sm'}
              className="inline-flex"
              onClick={(e) => e.preventDefault()}
            >
              <SquareFunction />
            </Button>
          </FormLabel>
          <SearchableSelect
            options={property.options.options}
            onChange={field.onChange}
            value={field.value}
            placeholder={property.options.placeholder ?? 'Select a option'}
          ></SearchableSelect>
          {property.description && (
            <ReadMoreDescription text={property.description} />
          )}
        </>
      );
    case PropertyType.DATE_TIME:
    case PropertyType.SHORT_TEXT:
    case PropertyType.LONG_TEXT:
    case PropertyType.FILE:
    case PropertyType.NUMBER:
    case PropertyType.JSON:
    case PropertyType.MULTI_SELECT_DROPDOWN:
    case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
    case PropertyType.DROPDOWN:
    case PropertyType.DYNAMIC:
      return (
        <>
          <FormLabel htmlFor={key} className="flex items-center">
            <span>{property.displayName}</span>
            <span className="grow"></span>
            <Button
              variant={'ghost'}
              size={'sm'}
              className="inline-flex"
              onClick={(e) => e.preventDefault()}
            >
              <SquareFunction />
            </Button>
          </FormLabel>
          <Input {...field} id={key} type="text" />
          <FormDescription>{property.description}</FormDescription>
        </>
      );
    case PropertyType.BASIC_AUTH:
    case PropertyType.CUSTOM_AUTH:
    case PropertyType.SECRET_TEXT:
    case PropertyType.OAUTH2:
      return <p>AUTH</p>;
  }
};
AutoFormComponent.displayName = 'AutoFormComponent';
export { AutoFormComponent };
