#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/920a87b50729a867e21706dd0fa5c3739e273a84ed89eb2f3525633b2d6ef85c/contract';
import startContract from '../../snapshots/920a87b50729a867e21706dd0fa5c3739e273a84ed89eb2f3525633b2d6ef85c/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/bd50bf59273aef5ae7e98a922a20f8776545a8743b2da763b17c56981d1de290/contract';
import endContract from '../../snapshots/bd50bf59273aef5ae7e98a922a20f8776545a8743b2da763b17c56981d1de290/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropTable({ schema: 'public', table: 'Post' }),
      this.createTable({
        schema: 'public',
        table: 'App',
        columns: [
          col('branch', 'text', { default: lit('main'), codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('cwd', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('environment', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('secret', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'AppAction',
        columns: [
          col('appId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('command', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('timeoutSec', 'int4', {
            notNull: true,
            default: lit(300),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Deployment',
        columns: [
          col('actionName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('appId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('command', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('durationMs', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('exitCode', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('finishedAt', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('metadata', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('startedAt', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('QUEUED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('stderr', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('stdout', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('triggerIp', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('triggeredBy', 'text', {
            notNull: true,
            default: lit('WEBHOOK'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('role', 'text', {
          notNull: true,
          default: lit('ADMIN'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'User',
        column: 'password',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
      this.addUnique({
        schema: 'public',
        table: 'App',
        constraint: 'App_slug_key',
        columns: ['slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'App',
        constraint: 'App_secret_key',
        columns: ['secret'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AppAction',
        index: 'AppAction_appId_idx_d1a42664',
        columns: ['appId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Deployment',
        index: 'Deployment_appId_idx_d1a42664',
        columns: ['appId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'AppAction',
        foreignKey: {
          name: 'AppAction_appId_fkey',
          columns: ['appId'],
          references: { schema: 'public', table: 'App', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Deployment',
        foreignKey: {
          name: 'Deployment_appId_fkey',
          columns: ['appId'],
          references: { schema: 'public', table: 'App', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
