import { Holiday } from './Model'


export class MissingFieldError extends Error {}


export function validateAsHolidayEntry(arg: any) {
  if (!(arg as Holiday).State) {
    throw new MissingFieldError('Value for State required!')
  }
  if (!(arg as Holiday).SK) {
    throw new MissingFieldError('Value for SK (sort key) required!')
  }
  if (!(arg as Holiday).Name) {
    throw new MissingFieldError('Value for Name required!')
  }
}