import {
  BranchExecutionType,
  BranchOperator,
  FlowActionType,
  FlowTriggerType,
  FlowVersion,
  FlowVersionState,
  PropertyExecutionType,
  RouterExecutionType,
} from '../../src'

const NOW = '2024-01-01T00:00:00.000Z'

export const expenseReimbursementFlowExample: FlowVersion = {
  id: 'flow-expense-reimbursement',
  flowId: 'flow-expense-reimbursement',
  displayName: 'Expense Reimbursement Processing',
  created: NOW,
  updated: NOW,
  updatedBy: '',
  notes: [],
  agentIds: [],
  connectionIds: [],
  valid: true,
  state: FlowVersionState.DRAFT,
  trigger: {
    name: 'trigger',
    displayName: 'New Expense Claim (Webhook)',
    type: FlowTriggerType.PIECE,
    valid: true,
    lastUpdatedDate: NOW,
    settings: {
      input: {},
      pieceName: 'webhook',
      pieceVersion: '0.52.0',
      triggerName: 'catchWebhook',
      propertySettings: {},
    },
    // 1. Webhook trigger -> upload receipts
    nextAction: {
      name: 'upload_receipts',
      displayName: 'Upload Receipt Images',
      type: FlowActionType.PIECE,
      valid: true,
      lastUpdatedDate: NOW,
      settings: {
        pieceName: 'http',
        pieceVersion: '0.20.3',
        actionName: 'send_request',
        input: {
          method: 'POST',
          url: 'https://storage/api/v1/documents',
          headers: {
            'Content-Type': 'application/json',
          },
          queryParams: {},
          body_type: 'json',
          body: {
            data: {
              // {{trigger.body.receipts}}
              receipts: '{{trigger.body.receipts}}',
            },
          },
          authType: 'NONE',
          response_is_binary: false,
          use_proxy: false,
          failureMode: 'continue_none',
        },
        propertySettings: {
          url: { type: PropertyExecutionType.MANUAL },
        },
        customLogoUrl: undefined,
        sampleData: undefined,
      },
      // 2. Normalize payload into a canonical expense object
      nextAction: {
        name: 'normalize_expense',
        displayName: 'Normalize Expense Data',
        type: FlowActionType.CODE,
        valid: true,
        lastUpdatedDate: NOW,
        settings: {
          sourceCode: {
            packageJson: '{}',
            code: `
export async function main({ trigger }: any) {
  const body = trigger.body || {};
  return {
    employee_id: body.employee_id,
    amount: body.amount,
    category: body.category,
    expense_date: body.expense_date,
    receipts: body.receipts,
    document_urls: '{{steps.upload_receipts.body.document_urls}}',
  };
}
          `.trim(),
          },
          input: {},
        },
        // 3. Create expense in Workday (generic HTTP)
        nextAction: {
          name: 'create_workday_expense',
          displayName: 'Create Expense in Workday',
          type: FlowActionType.PIECE,
          valid: true,
          lastUpdatedDate: NOW,
          settings: {
            pieceName: 'http',
            pieceVersion: '0.20.3',
            actionName: 'send_request',
            input: {
              method: 'POST',
              url: 'https://workday/api/v1/expenses',
              headers: {
                'Content-Type': 'application/json',
              },
              queryParams: {},
              body_type: 'json',
              body: {
                data: {
                  employee_id: '{{steps.normalize_expense.employee_id}}',
                  amount: '{{steps.normalize_expense.amount}}',
                  category: '{{steps.normalize_expense.category}}',
                  expense_date: '{{steps.normalize_expense.expense_date}}',
                  attachments: '{{steps.normalize_expense.document_urls}}',
                },
              },
              authType: 'BEARER_TOKEN',
              authFields: {
                token: '{{connections.workday.token}}',
              },
              response_is_binary: false,
              use_proxy: false,
              failureMode: 'continue_none',
            },
            propertySettings: {
              url: { type: PropertyExecutionType.MANUAL },
            },
            customLogoUrl: undefined,
            sampleData: undefined,
          },
          // 4. Switch on amount for approvals
          nextAction: {
            name: 'route_by_amount',
            displayName: 'Route by Amount',
            type: FlowActionType.ROUTER,
            valid: true,
            lastUpdatedDate: NOW,
            settings: {
              executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
              branches: [
                {
                  branchType: BranchExecutionType.CONDITION,
                  branchName: 'under_500_auto_approve',
                  conditions: [
                    [
                      {
                        operator: BranchOperator.NUMBER_IS_LESS_THAN,
                        firstValue: '{{steps.normalize_expense.amount}}',
                        secondValue: '500',
                      },
                    ],
                  ],
                },
                {
                  branchType: BranchExecutionType.CONDITION,
                  branchName: 'between_501_and_2000_manager_approve',
                  conditions: [
                    [
                      {
                        operator: BranchOperator.NUMBER_IS_GREATER_THAN,
                        firstValue: '{{steps.normalize_expense.amount}}',
                        secondValue: '500',
                      },
                      {
                        operator: BranchOperator.NUMBER_IS_LESS_THAN,
                        firstValue: '{{steps.normalize_expense.amount}}',
                        secondValue: '2000',
                      },
                    ],
                  ],
                },
                {
                  branchType: BranchExecutionType.FALLBACK,
                  branchName: 'above_2000_finance_approval',
                },
              ],
            },
            children: [
              // < $500 path – auto approve in Workday and trigger payroll
              {
                name: 'auto_approve_and_payroll',
                displayName: 'Auto Approve and Trigger Payroll',
                type: FlowActionType.PIECE,
                valid: true,
                lastUpdatedDate: NOW,
                settings: {
                  pieceName: 'http',
                  pieceVersion: '0.20.3',
                  actionName: 'send_request',
                  input: {
                    method: 'POST',
                    url: 'https://payroll/api/v1/reimbursements',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    queryParams: {},
                    body_type: 'json',
                    body: {
                      data: {
                        employee_id: '{{steps.normalize_expense.employee_id}}',
                        amount: '{{steps.normalize_expense.amount}}',
                        expense_id: '{{steps.create_workday_expense.body.id}}',
                      },
                    },
                    authType: 'BEARER_TOKEN',
                    authFields: {
                      token: '{{connections.payroll.token}}',
                    },
                    response_is_binary: false,
                    use_proxy: false,
                    failureMode: 'continue_none',
                  },
                  propertySettings: {},
                  customLogoUrl: undefined,
                  sampleData: undefined,
                },
              },
              // 501–2000 path – Slack manager approval
              {
                name: 'manager_slack_approval',
                displayName: 'Manager Slack Approval',
                type: FlowActionType.PIECE,
                valid: true,
                lastUpdatedDate: NOW,
                settings: {
                  pieceName: 'slack',
                  pieceVersion: '~0.66.7',
                  actionName: 'send_message',
                  input: {
                    channel: '{{steps.normalize_expense.manager_slack_channel}}',
                    text: 'Approve expense {{steps.normalize_expense.amount}} for {{steps.normalize_expense.employee_id}}?',
                  },
                  propertySettings: {},
                  customLogoUrl: undefined,
                  sampleData: undefined,
                },
              },
              // > 2000 path – create ServiceNow ticket
              {
                name: 'finance_servicenow_ticket',
                displayName: 'Create Finance Review Ticket',
                type: FlowActionType.PIECE,
                valid: true,
                lastUpdatedDate: NOW,
                settings: {
                  pieceName: 'serviceNow',
                  pieceVersion: '~0.36.1',
                  actionName: 'create_record',
                  input: {
                    table: 'incident',
                    short_description: 'High-value expense approval required',
                    description:
                      'Expense {{steps.normalize_expense.amount}} for {{steps.normalize_expense.employee_id}} requires finance approval.',
                  },
                  propertySettings: {},
                  customLogoUrl: undefined,
                  sampleData: undefined,
                },
              },
            ],
            // After router completes, continue with NetSuite + notification
            nextAction: {
              name: 'create_netsuite_payment',
              displayName: 'Create NetSuite Vendor Bill',
              type: FlowActionType.PIECE,
              valid: true,
              lastUpdatedDate: NOW,
              settings: {
                pieceName: 'netsuite',
                pieceVersion: '~0.1.0',
                actionName: 'create_vendor_bill',
                input: {
                  amount: '{{steps.normalize_expense.amount}}',
                  employee_id: '{{steps.normalize_expense.employee_id}}',
                },
                propertySettings: {},
                customLogoUrl: undefined,
                sampleData: undefined,
              },
              nextAction: {
                name: 'set_expected_payment_date',
                displayName: 'Set Expected Payment Date',
                type: FlowActionType.CODE,
                valid: true,
                lastUpdatedDate: NOW,
                settings: {
                  sourceCode: {
                    packageJson: '{}',
                    code: `
export async function main({ steps }: any) {
  const created = new Date(steps.normalize_expense.expense_date || Date.now());
  const expected = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    expected_payment_date: expected.toISOString(),
  };
}
                    `.trim(),
                  },
                  input: {},
                },
                nextAction: {
                  name: 'notify_employee',
                  displayName: 'Notify Employee (Slack)',
                  type: FlowActionType.PIECE,
                  valid: true,
                  lastUpdatedDate: NOW,
                  settings: {
                    pieceName: 'slack',
                    pieceVersion: '~0.66.7',
                    actionName: 'send_message',
                    input: {
                      channel: '{{steps.normalize_expense.employee_slack_channel}}',
                      text:
                        'Your expense has been scheduled for payment on {{steps.set_expected_payment_date.expected_payment_date}}.',
                    },
                    propertySettings: {},
                    customLogoUrl: undefined,
                    sampleData: undefined,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}

export const paymentStatusMonitoringFlowExample: FlowVersion = {
  id: 'flow-payment-status-monitor',
  flowId: 'flow-payment-status-monitor',
  displayName: 'Payment Status Monitor',
  created: NOW,
  updated: NOW,
  updatedBy: '',
  notes: [],
  agentIds: [],
  connectionIds: [],
  valid: true,
  state: FlowVersionState.DRAFT,
  trigger: {
    name: 'trigger',
    displayName: 'Daily Payment Status Check',
    type: FlowTriggerType.PIECE,
    valid: true,
    lastUpdatedDate: NOW,
    settings: {
      input: {
        cronExpression: '0 3 * * *',
        timezone: 'UTC',
      },
      pieceName: 'schedule',
      pieceVersion: '0.30.0',
      triggerName: 'cron_expression',
      propertySettings: {
        cronExpression: { type: PropertyExecutionType.MANUAL },
      },
    },
    nextAction: {
      name: 'find_delayed_payments',
      displayName: 'Find Delayed Payments in NetSuite',
      type: FlowActionType.PIECE,
      valid: true,
      lastUpdatedDate: NOW,
      settings: {
        pieceName: 'netsuite',
        pieceVersion: '~0.1.0',
        actionName: 'runSuiteQL',
        input: {
          // Pseudo-query: all payments pending > 10 days
          query:
            'SELECT * FROM payments WHERE status = \\'PENDING\\' AND created_date < CURRENT_DATE - 10',
        },
        propertySettings: {},
        customLogoUrl: undefined,
        sampleData: undefined,
      },
      nextAction: {
        name: 'alert_finance_and_hr',
        displayName: 'Alert Finance and HR (Slack)',
        type: FlowActionType.PIECE,
        valid: true,
        lastUpdatedDate: NOW,
        settings: {
          pieceName: 'slack',
          pieceVersion: '~0.66.7',
          actionName: 'send_message',
          input: {
            channel: '#finance-ops',
            text:
              'There are delayed expense payments older than 10 days in NetSuite. Please review the dashboard.',
          },
          propertySettings: {},
          customLogoUrl: undefined,
          sampleData: undefined,
        },
      },
    },
  },
}

