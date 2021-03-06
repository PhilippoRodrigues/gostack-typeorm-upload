import { getCustomRepository, getRepository } from 'typeorm';

// import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const categories = getRepository(Category);

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('Outcome value is bigger than total', 400);
    }

    // Se EXISTIR uma categoria, a variável category será atribuída ao title.
    let transactionCategory = await categories.findOne({
      where: { title: category },
    });

    // Se NÃO houver determinada categoria já cadastrada, será CRIADA UMA CATEGORIA
    if (!transactionCategory) {
      transactionCategory = categories.create({
        title: category,
      });

      await categories.save(transactionCategory);
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category: transactionCategory,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
