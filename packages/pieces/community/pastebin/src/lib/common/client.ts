import axios from 'axios';

export enum PastePrivacy {
  PUBLIC = '0',
  UNLISTED = '1',
  PRIVATE = '2',
}

export enum PasteExpiry {
  NEVER = 'N',
  TEN_MINUTES = '10M',
  ONE_HOUR = '1H',
  ONE_DAY = '1D',
  ONE_WEEK = '1W',
  TWO_WEEKS = '2W',
  ONE_MONTH = '1M',
  SIX_MONTHS = '6M',
  ONE_YEAR = '1Y',
}

export interface PasteCreateRequest {
  paste_code: string;
  paste_private?: PastePrivacy;
  paste_name?: string;
  paste_expiry_date?: string;
  paste_format?: string;
  folder_key?: string;
}

export class PastebinClient {
  private user_key?: string;

  constructor(private token: string) {}

  setUserKey(user_key: string) {
    this.user_key = user_key;
  }

  async makeRequest(
    script: string,
    option: string,
    body: Record<string, any>
  ): Promise<string> {
    const req = new URLSearchParams({
      api_option: option,
      api_dev_key: this.token,
    });
    if (this.user_key) {
      req.append('api_user_key', this.user_key);
    }
    Object.keys(body)
      .filter((k) => body[k] !== undefined && body[k] !== null)
      .forEach((k) => req.append('api_' + k, body[k]));
    const res = await axios.post('https://pastebin.com/api/' + script, req, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    });
    return res.data;
  }

  async login(username: string, password: string): Promise<string> {
    return await this.makeRequest('api_login.php', 'login', {
      user_name: username,
      user_password: password,
    });
  }

  async createPaste(request: PasteCreateRequest): Promise<string> {
    return await this.makeRequest('api_post.php', 'paste', request);
  }

  async getPasteContent(id: string): Promise<string> {
    if (this.user_key) {
      return await this.makeRequest('api_raw.php', 'show_paste', {
        paste_key: id,
      });
    } else {
      return (await axios.get('https://pastebin.com/raw/' + id)).data;
    }
  }
}
