import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import raw from './data.json';

const mock = new MockAdapter(axios, { delayResponse: 500 });

// фейковый эндпоинт
mock.onGet('/api/shareholders').reply(200, raw);

export {};
