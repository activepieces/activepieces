import { createContact } from './create-contact';

describe('Create Contact Action', () => {
  it('should have the correct name', () => {
    expect(createContact.name).toBe('create_contact');
  });

  it('should have the correct display name', () => {
    expect(createContact.displayName).toBe('Create Contact');
  });

  it('should have required props', () => {
    const props = createContact.props;
    expect(props.first_name).toBeDefined();
    expect(props.last_name).toBeDefined();
    expect(props.first_name.required).toBe(true);
    expect(props.last_name.required).toBe(true);
  });

  it('should have optional props', () => {
    const props = createContact.props;
    expect(props.email).toBeDefined();
    expect(props.phone).toBeDefined();
    expect(props.email.required).toBe(false);
    expect(props.phone.required).toBe(false);
  });
}); 