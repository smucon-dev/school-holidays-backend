import { HolidayStack } from './HolidayStack'
import { App } from 'aws-cdk-lib'

const app = new App()
new HolidayStack(app, 'school-holidays', {
  stackName: 'SchoolHolidays'
})