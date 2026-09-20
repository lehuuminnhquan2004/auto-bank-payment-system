import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAllActive() {
    const products =
      await this.prisma.product.findMany({
        where: {
          isActive: true,

          price: {
            gt: 0n,
          },
        },

        orderBy: {
          id: 'asc',
        },
      });

    return products.map((product) => ({
      id: product.id.toString(),
      name: product.name,
      price: product.price.toString(),
    }));
  }
}