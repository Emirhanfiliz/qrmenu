import { BadRequestException, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import sharp = require('sharp');

const MENU_SCHEMA = {
  type: 'object',
  properties: {
    categories: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                price: { type: 'number' },
              },
              required: ['name', 'description', 'price'],
              additionalProperties: false,
            },
          },
        },
        required: ['name', 'products'],
        additionalProperties: false,
      },
    },
  },
  required: ['categories'],
  additionalProperties: false,
} as const;

@Injectable()
export class ImportService {
  async analyzeMenuPhoto(buffer: Buffer) {
    if (!process.env.OPENAI_API_KEY) {
      throw new BadRequestException('Menü analizi için OPENAI_API_KEY tanımlı değil.');
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const resized = await sharp(buffer)
      .resize({ width: 800, height: 1200, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const base64 = resized.toString('base64');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'menu_extraction',
          strict: true,
          schema: MENU_SCHEMA,
        },
      },
      messages: [
        {
          role: 'system',
          content:
            'Sen bir restoran menüsü analiz asistanısın. Verilen menü fotoğrafından tüm kategori ve ürünleri çıkar. ' +
            'Fiyatları sayısal yaz (₺ veya TL sembolü olmadan). ' +
            'Ürün açıklaması yoksa boş string kullan. ' +
            'Fotoğrafta olmayan veri uydurma.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'high' },
            },
            { type: 'text', text: 'Bu menüdeki tüm kategori ve ürünleri JSON olarak çıkar.' },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new BadRequestException('API boş yanıt döndü.');

    return JSON.parse(content) as { categories: { name: string; products: { name: string; description: string; price: number }[] }[] };
  }
}
