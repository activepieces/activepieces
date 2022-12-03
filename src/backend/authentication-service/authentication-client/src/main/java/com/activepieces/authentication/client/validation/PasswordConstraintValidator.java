package com.activepieces.authentication.client.validation;

import org.passay.*;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

public class PasswordConstraintValidator implements ConstraintValidator<ValidPassword, String> {

  @Override
  public void initialize(ValidPassword arg0) {}

  @Override
  public boolean isValid(String password, ConstraintValidatorContext context) {
    if (Objects.isNull(password)) {
      context
          .buildConstraintViolationWithTemplate("Password is null")
          .addConstraintViolation()
          .disableDefaultConstraintViolation();
      return false;
    }
    PasswordValidator validator =
        new PasswordValidator(
            Arrays.asList(
                new LengthRule(8, 64),
                new DigitCharacterRule(1),
                new SpecialCharacterRule(1),
                new AlphabeticalCharacterRule(1),
                new WhitespaceRule()));

    RuleResult result = validator.validate(new PasswordData(password));
    if (result.isValid()) {
      return true;
    }
    List<String> messages = validator.getMessages(result);
    String messageTemplate = String.join(",", messages);
    context
        .buildConstraintViolationWithTemplate(messageTemplate)
        .addConstraintViolation()
        .disableDefaultConstraintViolation();
    return false;
  }
}
