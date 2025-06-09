import { SerpApiConfig, SerpApiEngine, ValidationResult } from '../types';

// Validation constants
export const VALIDATION_CONSTANTS = {
  MAX_RESULTS: 100,
  MIN_RESULTS: 1,
  MAX_START_POSITION: 990,
  MIN_START_POSITION: 0,
  VALID_DEVICE_TYPES: ['desktop', 'mobile', 'tablet'],
  VALID_SAFE_SEARCH: ['active', 'off'],
  VALID_BOOLEAN_STRINGS: ['true', 'false'],
  VALID_FILTER_VALUES: ['0', '1'],
  VALID_UPLOAD_DATE: ['any', 'hour', 'today', 'week', 'month', 'year'],
  MAX_GOOGLE_DOMAIN_LENGTH: 50,
} as const;

// Core validation utility class
export class SerpApiValidator {
  // Validates an API key format and structure
  static validateApiKey(apiKey: string): ValidationResult {
    const errors: string[] = [];

    if (!apiKey) {
      errors.push('API key is required');
    } else if (typeof apiKey !== 'string') {
      errors.push('API key must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates a search query
   */
  static validateQuery(query: string): ValidationResult {
    const errors: string[] = [];

    if (!query) {
      errors.push('Search query is required');
    } else if (typeof query !== 'string') {
      errors.push('Search query must be a string');
    } else {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length === 0) {
        errors.push('Search query cannot be empty or only whitespace');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates language code
   */
  static validateLanguageCode(language?: string): ValidationResult {
    const errors: string[] = [];

    if (language !== undefined) {
      if (typeof language !== 'string') {
        errors.push('Language code must be a string');
      } else if (language.length !== 2) {
        errors.push('Language code must be exactly 2 characters (ISO 639-1 format)');
      } else if (!/^[a-z]{2}$/.test(language)) {
        errors.push('Language code must contain only lowercase letters');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates country code
   */
  static validateCountryCode(country?: string): ValidationResult {
    const errors: string[] = [];

    if (country !== undefined) {
      if (typeof country !== 'string') {
        errors.push('Country code must be a string');
      } else if (country.length !== 2) {
        errors.push('Country code must be exactly 2 characters (ISO 3166-1 alpha-2 format)');
      } else if (!/^[a-z]{2}$/.test(country)) {
        errors.push('Country code must contain only lowercase letters');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates number of results
   */
  static validateNumResults(num?: number): ValidationResult {
    const errors: string[] = [];

    if (num !== undefined) {
      if (typeof num !== 'number') {
        errors.push('Number of results must be a number');
      } else if (!Number.isInteger(num)) {
        errors.push('Number of results must be an integer');
      } else if (num < VALIDATION_CONSTANTS.MIN_RESULTS) {
        errors.push(`Number of results must be at least ${VALIDATION_CONSTANTS.MIN_RESULTS}`);
      } else if (num > VALIDATION_CONSTANTS.MAX_RESULTS) {
        errors.push(`Number of results cannot exceed ${VALIDATION_CONSTANTS.MAX_RESULTS}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates start position for pagination
   */
  static validateStartPosition(start?: number): ValidationResult {
    const errors: string[] = [];

    if (start !== undefined) {
      if (typeof start !== 'number') {
        errors.push('Start position must be a number');
      } else if (!Number.isInteger(start)) {
        errors.push('Start position must be an integer');
      } else if (start < VALIDATION_CONSTANTS.MIN_START_POSITION) {
        errors.push(`Start position cannot be negative`);
      } else if (start > VALIDATION_CONSTANTS.MAX_START_POSITION) {
        errors.push(`Start position cannot exceed ${VALIDATION_CONSTANTS.MAX_START_POSITION}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates device type
   */
  static validateDeviceType(device?: string): ValidationResult {
    const errors: string[] = [];

    if (device !== undefined) {
      if (typeof device !== 'string') {
        errors.push('Device type must be a string');
      } else if (!VALIDATION_CONSTANTS.VALID_DEVICE_TYPES.includes(device as any)) {
        errors.push(`Device type must be one of: ${VALIDATION_CONSTANTS.VALID_DEVICE_TYPES.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates safe search setting
   */
  static validateSafeSearch(safe?: string): ValidationResult {
    const errors: string[] = [];

    if (safe !== undefined) {
      if (typeof safe !== 'string') {
        errors.push('Safe search setting must be a string');
      } else if (!VALIDATION_CONSTANTS.VALID_SAFE_SEARCH.includes(safe as any)) {
        errors.push(`Safe search must be one of: ${VALIDATION_CONSTANTS.VALID_SAFE_SEARCH.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates location parameter
   */
  static validateLocation(location?: string): ValidationResult {
    const errors: string[] = [];

    if (location !== undefined) {
      if (typeof location !== 'string') {
        errors.push('Location must be a string');
      } else if (location.trim().length === 0) {
        errors.push('Location cannot be empty or only whitespace');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates Google domain parameter
   */
  static validateGoogleDomain(googleDomain?: string): ValidationResult {
    const errors: string[] = [];

    if (googleDomain !== undefined) {
      if (typeof googleDomain !== 'string') {
        errors.push('Google domain must be a string');
      } else if (googleDomain.trim().length === 0) {
        errors.push('Google domain cannot be empty or only whitespace');
      } else if (googleDomain.length > VALIDATION_CONSTANTS.MAX_GOOGLE_DOMAIN_LENGTH) {
        errors.push(`Google domain is too long (maximum ${VALIDATION_CONSTANTS.MAX_GOOGLE_DOMAIN_LENGTH} characters)`);
      } else if (!/^[a-zA-Z0-9.-]+$/.test(googleDomain)) {
        errors.push('Google domain contains invalid characters (only alphanumeric, dots, and dashes allowed)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates boolean string parameters (no_cache, async)
   */
  static validateBooleanString(value?: string, fieldName = 'parameter'): ValidationResult {
    const errors: string[] = [];

    if (value !== undefined) {
      if (typeof value !== 'string') {
        errors.push(`${fieldName} must be a string`);
      } else if (!VALIDATION_CONSTANTS.VALID_BOOLEAN_STRINGS.includes(value as 'true' | 'false')) {
        errors.push(`${fieldName} must be one of: ${VALIDATION_CONSTANTS.VALID_BOOLEAN_STRINGS.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates filter parameter
   */
  static validateFilter(filter?: string): ValidationResult {
    const errors: string[] = [];

    if (filter !== undefined) {
      if (typeof filter !== 'string') {
        errors.push('Filter must be a string');
      } else if (!VALIDATION_CONSTANTS.VALID_FILTER_VALUES.includes(filter as '0' | '1')) {
        errors.push(`Filter must be one of: ${VALIDATION_CONSTANTS.VALID_FILTER_VALUES.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates YouTube sort parameter
   */
  static validateYouTubeSort(sortBy?: string): ValidationResult {
    const errors: string[] = [];

    if (sortBy !== undefined) {
      if (typeof sortBy !== 'string') {
        errors.push('Sort parameter must be a string');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates YouTube duration parameter
   */
  static validateYouTubeDuration(duration?: string): ValidationResult {
    const errors: string[] = [];

    if (duration !== undefined) {
      if (typeof duration !== 'string') {
        errors.push('Duration parameter must be a string');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates YouTube quality parameter
   */
  static validateYouTubeQuality(quality?: string): ValidationResult {
    const errors: string[] = [];

    if (quality !== undefined) {
      if (typeof quality !== 'string') {
        errors.push('Quality parameter must be a string');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates YouTube upload date parameter
   */
  static validateUploadDate(uploadDate?: string): ValidationResult {
    const errors: string[] = [];

    if (uploadDate !== undefined) {
      if (typeof uploadDate !== 'string') {
        errors.push('Upload date parameter must be a string');
      } else if (!VALIDATION_CONSTANTS.VALID_UPLOAD_DATE.includes(uploadDate as 'any' | 'hour' | 'today' | 'week' | 'month' | 'year')) {
        errors.push(`Upload date parameter must be one of: ${VALIDATION_CONSTANTS.VALID_UPLOAD_DATE.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates mutual exclusivity of no_cache and async parameters
   */
  static validateCacheAsyncMutualExclusivity(noCache?: string, async?: string): ValidationResult {
    const errors: string[] = [];

    if (noCache === 'true' && async === 'true') {
      errors.push('no_cache and async parameters cannot both be set to true');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates a complete SerpApi configuration
   */
  static validateConfig(config: Partial<SerpApiConfig>): ValidationResult {
    const allErrors: string[] = [];

    // Validate required fields
    if (!config.api_key) {
      allErrors.push('API key is required');
    } else {
      const apiKeyValidation = this.validateApiKey(config.api_key);
      allErrors.push(...apiKeyValidation.errors);
    }

    if (!config.engine) {
      allErrors.push('Engine is required');
    } else if (!Object.values(SerpApiEngine).includes(config.engine)) {
      allErrors.push(`Engine must be one of: ${Object.values(SerpApiEngine).join(', ')}`);
    }

    // Validate optional common fields
    if (config.hl) {
      const languageValidation = this.validateLanguageCode(config.hl);
      allErrors.push(...languageValidation.errors);
    }

    if (config.gl) {
      const countryValidation = this.validateCountryCode(config.gl);
      allErrors.push(...countryValidation.errors);
    }

    if (config.num) {
      const numValidation = this.validateNumResults(config.num);
      allErrors.push(...numValidation.errors);
    }

    if (config.start) {
      const startValidation = this.validateStartPosition(config.start);
      allErrors.push(...startValidation.errors);
    }

    // Validate additional parameters
    const configAny = config as any;

    if (configAny.location) {
      const locationValidation = this.validateLocation(configAny.location);
      allErrors.push(...locationValidation.errors);
    }

    if (configAny.google_domain) {
      const googleDomainValidation = this.validateGoogleDomain(configAny.google_domain);
      allErrors.push(...googleDomainValidation.errors);
    }

    if (configAny.no_cache) {
      const noCacheValidation = this.validateBooleanString(configAny.no_cache, 'no_cache');
      allErrors.push(...noCacheValidation.errors);
    }

    if (configAny.async) {
      const asyncValidation = this.validateBooleanString(configAny.async, 'async');
      allErrors.push(...asyncValidation.errors);
    }

    if (configAny.filter) {
      const filterValidation = this.validateFilter(configAny.filter);
      allErrors.push(...filterValidation.errors);
    }

    if (configAny.safe) {
      const safeValidation = this.validateSafeSearch(configAny.safe);
      allErrors.push(...safeValidation.errors);
    }

    if (configAny.device) {
      const deviceValidation = this.validateDeviceType(configAny.device);
      allErrors.push(...deviceValidation.errors);
    }

    // Validate mutual exclusivity
    const mutualExclusivityValidation = this.validateCacheAsyncMutualExclusivity(
      configAny.no_cache,
      configAny.async
    );
    allErrors.push(...mutualExclusivityValidation.errors);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  /**
   * Sanitizes and normalizes input parameters
   */
  static sanitizeConfig(config: Partial<SerpApiConfig>): Partial<SerpApiConfig> {
    const sanitized = { ...config };

    // Trim and normalize string fields
    if (sanitized.hl) {
      sanitized.hl = sanitized.hl.toLowerCase().trim();
    }

    if (sanitized.gl) {
      sanitized.gl = sanitized.gl.toLowerCase().trim();
    }

    if (sanitized.api_key) {
      sanitized.api_key = sanitized.api_key.trim();
    }

    // Sanitize additional parameters
    const sanitizedAny = sanitized as any;

    if (sanitizedAny.location) {
      sanitizedAny.location = sanitizedAny.location.trim();
    }

    if (sanitizedAny.google_domain) {
      sanitizedAny.google_domain = sanitizedAny.google_domain.toLowerCase().trim();
    }

    if (sanitizedAny.no_cache) {
      sanitizedAny.no_cache = sanitizedAny.no_cache.toLowerCase().trim();
    }

    if (sanitizedAny.async) {
      sanitizedAny.async = sanitizedAny.async.toLowerCase().trim();
    }

    if (sanitizedAny.filter) {
      sanitizedAny.filter = sanitizedAny.filter.trim();
    }

    if (sanitizedAny.safe) {
      sanitizedAny.safe = sanitizedAny.safe.toLowerCase().trim();
    }

    if (sanitizedAny.device) {
      sanitizedAny.device = sanitizedAny.device.toLowerCase().trim();
    }

    // Ensure numbers are properly typed
    if (sanitized.num && typeof sanitized.num === 'string') {
      const parsed = parseInt(sanitized.num, 10);
      if (!isNaN(parsed)) {
        sanitized.num = parsed;
      }
    }

    if (sanitized.start && typeof sanitized.start === 'string') {
      const parsed = parseInt(sanitized.start, 10);
      if (!isNaN(parsed)) {
        sanitized.start = parsed;
      }
    }

    // Remove undefined values
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key as keyof typeof sanitized] === undefined) {
        delete sanitized[key as keyof typeof sanitized];
      }
    });

    return sanitized;
  }

  /**
   * Validates and sanitizes config, throwing error if invalid
   */
  static validateAndSanitize(config: Partial<SerpApiConfig>): SerpApiConfig {
    const sanitized = this.sanitizeConfig(config);
    const validation = this.validateConfig(sanitized);

    if (!validation.isValid) {
      throw new Error(
        `Configuration validation failed: ${validation.errors.join(', ')}`,
      );
    }

    return sanitized as SerpApiConfig;
  }
}
