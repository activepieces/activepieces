import { secretManagersService } from '../../../../src/app/secret-managers/secret-managers.service'

describe('SecretManagersService', () => {
  let service: ReturnType<typeof secretManagersService>

  beforeEach(() => {
    service = secretManagersService()
  })

  describe('resolve with success cases', () => {
    it('should resolve a simple secret key', async () => {
      const key = '{{ aws:simple-key }}'
      
      const result = await service.resolve({ key })
      
      expect(result).toBe('simple-secret')
    })

    it('should resolve a secret with JSON path', async () => {
      const result = await service.resolve({ key: '{{ aws:api-key:sec:secret[0] }}' })
      const result2 = await service.resolve({ key: '{{ aws:api-key:sec:secret[1] }}' })
      
      expect(result).toBe('secret-1')
      expect(result2).toBe('secret-2')
    })

    it('should resolve a secret with JSON path with nested object', async () => {
      const result = await service.resolve({ key: '{{ aws:config: database :password:db-password }}' })
      
      expect(result).toBe('db-password')
    })

  })

  describe('resolve with failed cases', () => {
    it('should throw an error if the secret key is not found', async () => {
      const key = '{{ aws:nonexistent-secret }}'
      
      await expect(service.resolve({ key }))
        .rejects.toThrow("Secret 'nonexistent-secret' not found")
    })

    it('should throw an error for invalid array index', async () => {
      await expect(service.resolve({ key: '{{ aws:api-key:sec:secret[10] }}' }))
        .rejects.toThrow('Array index out of bounds')
    })

    it('should throw an error for invalid path', async () => {
      await expect(service.resolve({ key: '{{ aws:api-key:nonexistent:path }}' }))
        .rejects.toThrow('Could not resolve value path')
    })

    it('should throw an error for invalid key format', async () => {
      await expect(service.resolve({ key: 'invalid-key' }))
        .rejects.toThrow('Key is not a secret')
    })
  })
})