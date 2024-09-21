import './App.css';
import CurrencyInput from 'react-currency-input-field';
import { useState } from 'react';

const MAX_EMPLOYEE_LENGTH = 5;

// the spliters
const defaultTill = {
    employee: '',
    paidTips: '0.00',
    splitEach: '0.00',
    splitEachPercentage: '0.00%',
    splits: ['0.00'],
    totalSplit: '0.00',
    totalSplitPercentage: '0.00%',
    received: '0.00',
    receivedPercentage: '0.00%'
};

// format for CurrencyInputs
function toDollars(cents) {
    return (cents / 100).toFixed(2);
}

function toCents(dollars) {
    return Number(dollars) * 100;
}

function formatDollars(cents) {
    return (cents / 100).toLocaleString('en-ca', {
        style: 'currency',
        currency: 'CAD'
    });
}

function toPercent(num) {
    return `${((num || 0) * 100).toFixed(2)}%`;
}

// convert a till row to cents to avoid floaty math
function tillToCents(till) {
    return {
        paidTips: toCents(till.paidTips),
        splitEach: toCents(till.splitEach),
        splits: till.splits.map(toCents),
        totalSplit: toCents(till.totalSplit),
        received: toCents(till.received)
    };
}

function findNearestDivisibleNumber(number, divisor, max = Infinity) {
    const remainder = number % divisor;

    if (remainder === 0) {
        return number;
    }

    const nextLower = number - remainder;
    const nextHigher = number + divisor - remainder;

    return nextHigher > max ||
        Math.abs(nextLower - number) < Math.abs(nextHigher - number)
        ? nextLower
        : nextHigher;
}

function TillCurrencyInput(props) {
    return (
        <CurrencyInput
            prefix=""
            defaultValue={0}
            decimalsLimit={2}
            allowNegativeValue={false}
            {...props}
        />
    );
}

function PercentInput(props) {
    return (
        <input
            type="text"
            inputMode="decimal"
            maxLength={6}
            value={props.value}
            onChange={props.onChange}
            onBlur={(e) => {
                const dollars =
                    (Number.parseFloat(e.target.value) / 100) *
                    Number(props.paidTips);

                props.onBlur(dollars || 0);
            }}
        />
    );
}

function EmployeeIdInput(props) {
    const onChange = props.onChange || (() => {});

    return (
        <input
            value={props.value}
            type="text"
            inputMode="decimal"
            placeholder="ID"
            onChange={(e) => {
                const value = (e.target.value.match(/\d/g) || []).join('');
                onChange(value.slice(0, MAX_EMPLOYEE_LENGTH));
            }}
        />
    );
}

function DeleteButton(props) {
    return <button {...props}>X</button>;
}

function TillRow(props) {
    const till = {};
    Object.keys(defaultTill).forEach((key) => (till[key] = props[key]));

    const onChange = props.onChange || (() => {});

    const { spliteeLength } = props;

    const onSplitEachBlur = (value) => {
        if (!value) {
            const totalSplit = toCents(till.totalSplit);
            const splitEach = totalSplit / spliteeLength;
            const splitEachDollars = toDollars(splitEach);

            onChange(props.index, {
                ...till,
                splitEach: splitEachDollars,
                splitEachPercentage: toPercent(
                    splitEach / toCents(till.paidTips)
                ),
                splits: Array.from({
                    length: spliteeLength
                }).map(() => splitEachDollars)
            });

            return;
        }

        let splitEach = toCents(value);

        let { paidTips } = tillToCents(till);
        let totalSplit = splitEach * spliteeLength;

        if (totalSplit > paidTips) {
            totalSplit = paidTips;
        }

        totalSplit = findNearestDivisibleNumber(
            totalSplit,
            spliteeLength,
            paidTips
        );

        splitEach = totalSplit / spliteeLength;

        const splitEachDollars = toDollars(splitEach);
        const received = paidTips - totalSplit;

        onChange(props.index, {
            ...till,
            splitEach: splitEachDollars,
            splitEachPercentage: toPercent(splitEach / paidTips),
            splits: Array.from({ length: spliteeLength }).map(
                () => splitEachDollars
            ),
            totalSplit: toDollars(totalSplit),
            totalSplitPercentage: toPercent(totalSplit / paidTips),
            received: toDollars(received),
            receivedPercentage: toPercent(received / paidTips)
        });
    };

    const onTotalSplitBlur = (value) => {
        let totalSplit = toCents(value);
        const paidTips = toCents(till.paidTips);

        if (totalSplit > paidTips) {
            totalSplit = paidTips;
        }

        let splitEach = totalSplit / spliteeLength;

        totalSplit = findNearestDivisibleNumber(
            splitEach * spliteeLength,
            spliteeLength,
            paidTips
        );

        splitEach = totalSplit / spliteeLength;

        const splitEachDollars = toDollars(splitEach);
        const received = paidTips - totalSplit;

        onChange(props.index, {
            ...till,
            splitEach: splitEachDollars,
            splitEachPercentage: toPercent(splitEach / paidTips),
            splits: Array.from({ length: spliteeLength }).map(
                () => splitEachDollars
            ),
            totalSplit: toDollars(totalSplit),
            totalSplitPercentage: toPercent(totalSplit / paidTips),
            received: toDollars(received),
            receivedPercentage: toPercent(received / paidTips)
        });
    };

    const onReceivedBlur = (value) => {
        const paidTips = toCents(till.paidTips);
        let received = toCents(value);

        if (received >= paidTips) {
            received = paidTips;
        }

        const totalSplit = findNearestDivisibleNumber(
            paidTips - received,
            spliteeLength,
            paidTips
        );

        const splitEach = totalSplit / spliteeLength;
        const splitEachDollars = toDollars(splitEach);
        received = paidTips - totalSplit;

        onChange(props.index, {
            ...till,
            splitEach: splitEachDollars,
            splitEachPercentage: toPercent(
                splitEach / toCents(till.paidTips)
            ),
            splits: Array.from({ length: spliteeLength }).map(
                () => splitEachDollars
            ),
            totalSplit: toDollars(totalSplit),
            totalSplitPercentage: toPercent(
                totalSplit / paidTips
            ),
            received: toDollars(received),
            receivedPercentage: toPercent(received / paidTips)
        });
    };

    const splitEachInput = props.usePercentage ? (
        <PercentInput
            paidTips={till.paidTips}
            value={props.splitEachPercentage}
            onChange={(e) =>
                onChange(props.index, {
                    ...till,
                    splitEachPercentage: e.target.value
                })
            }
            onBlur={onSplitEachBlur}
        />
    ) : (
        <TillCurrencyInput
            onValueChange={(value) =>
                onChange(props.index, { ...till, splitEach: value })
            }
            onBlur={() => onSplitEachBlur(till.splitEach || 0)}
            value={props.splitEach}
            placeholder="Split-out each"
        />
    );

    const totalSplitInput = props.usePercentage ? (
        <PercentInput
            paidTips={till.paidTips}
            value={props.totalSplitPercentage}
            onChange={(e) =>
                onChange(props.index, {
                    ...till,
                    totalSplitPercentage: e.target.value
                })
            }
            onBlur={onTotalSplitBlur}
        />
    ) : (
        <TillCurrencyInput
            onValueChange={(value) =>
                onChange(props.index, { ...till, totalSplit: value })
            }
            onBlur={() => onTotalSplitBlur(till.totalSplit || 0)}
            placeholder="Total split-out"
            value={props.totalSplit}
        />
    );

    const receivedInput = props.usePercentage ? (
        <PercentInput
            paidTips={till.paidTips}
            value={till.receivedPercentage}
            onChange={(e) =>
                onChange(props.index, {
                    ...till,
                    receivedPercentage: e.target.value
                })
            }
            onBlur={onReceivedBlur}
        />
    ) : (
        <TillCurrencyInput
            onValueChange={(value) =>
                onChange(props.index, { ...till, received: value })
            }
            onBlur={() => onReceivedBlur(till.received || 0)}
            placeholder="Received tips"
            value={props.received}
        />
    );

    return (
        <tr>
            <td>
                <EmployeeIdInput
                    value={props.employee}
                    onChange={(id) =>
                        onChange(props.index, { ...till, employee: id })
                    }
                />
            </td>
            <td>
                <TillCurrencyInput
                    onValueChange={(value) =>
                        onChange(props.index, { ...till, paidTips: value })
                    }
                    onBlur={() => {
                        if (!till.paidTips) {
                            onChange(props.index, {
                                ...defaultTill,
                                splits: Array.from({
                                    length: spliteeLength
                                }).map(() => '0.00')
                            });

                            return;
                        }

                        const { paidTips, splitEach, totalSplit, received } =
                            tillToCents(till);

                        if (totalSplit > paidTips) {
                            onChange(props.index, {
                                ...till,
                                paidTips: toDollars(paidTips),
                                splitEach: toDollars(0),
                                splitEachPercentage: '0.00%',
                                splits: Array.from({
                                    length: spliteeLength
                                }).map(() => toDollars(0)),
                                totalSplit: toDollars(0),
                                totalSplitPercentage: '0.00%',
                                received: toDollars(paidTips),
                                receivedPercentage: '0.00%'
                            });
                        } else {
                            onChange(props.index, {
                                ...till,
                                paidTips: toDollars(paidTips),
                                splitEachPercentage: toPercent(
                                    splitEach / paidTips
                                ),
                                totalSplitPercentage: toPercent(
                                    totalSplit / paidTips
                                ),
                                received: toDollars(paidTips - totalSplit),
                                receivedPercentage: toPercent(received / paidTips)
                            });
                        }
                    }}
                    value={props.paidTips}
                    placeholder="Tip amount"
                />
            </td>
            <td>{splitEachInput}</td>
            <td>{totalSplitInput}</td>
            <td>{receivedInput}</td>
            <td>
                <DeleteButton onClick={() => onChange(props.index, undefined)}>
                    X
                </DeleteButton>
            </td>
        </tr>
    );
}

function SpliteeRow(props) {
    const onChange = props.onChange || (() => {});
    const onSplitChange = props.onSplitChange || (() => {});
    const onSplitBlur = props.onSplitBlur || (() => {});

    const totalSplits = props.splits.reduce((a, b) => a + (toCents(b) || 0), 0);

    return (
        <tr>
            <td>
                <EmployeeIdInput
                    value={props.splitee}
                    onChange={(id) => onChange(props.index, id)}
                />
            </td>
            {props.splits.map((split, i) => (
                <td key={`splitee-td-${i}`}>
                    <TillCurrencyInput
                        value={split}
                        onValueChange={(value) => onSplitChange(i, value)}
                        onBlur={() => onSplitBlur(i, props.index)}
                    />
                </td>
            ))}
            <td>{toDollars(totalSplits)}</td>
            <td>
                <DeleteButton onClick={() => onChange(props.index, undefined)}>
                    X
                </DeleteButton>
            </td>
        </tr>
    );
}

// return a new array with updated item at index, or filter it out if newItem
// is undefined
function updateArrayItem(array, index, newItem, defaultItem) {
    if (index === array.length) {
        return array.concat(newItem || defaultItem);
    }

    const newArray = newItem
        ? array.map((item, i) => (i === index ? newItem : item))
        : array.filter((_, i) => i !== index);

    return newArray.length ? newArray : [defaultItem];
}

function App() {
    const [tills, setTills] = useState([defaultTill]);
    const [splitees, setSplitees] = useState(['']);

    const updateTills = (newTillIndex, newTill) => {
        const newDefaultTill = {
            ...defaultTill,
            splits: Array.from({
                length: splitees.length
            }).map(() => '0.00')
        };

        setTills(updateArrayItem(tills, newTillIndex, newTill, newDefaultTill));
    };

    const updateSplitees = (newSpliteeIndex, newSplitee) => {
        const newSplitees = updateArrayItem(
            splitees,
            newSpliteeIndex,
            newSplitee,
            ''
        );

        setSplitees(newSplitees);

        const newTills = [...tills];

        if (newSplitees.length > splitees.length) {
            for (const till of newTills) {
                till.splits = till.splits.concat('0.00');

                const totalSplit = till.splits.reduce(
                    (a, b) => a + toCents(b),
                    0
                );

                const splitEach = totalSplit / newSplitees.length;

                till.splitEach = toDollars(splitEach);

                till.splitEachPercentage = toPercent(
                    splitEach / toCents(till.paidTips)
                );
            }
        } else if (!newSplitee) {
            for (const till of newTills) {
                till.splits = till.splits.filter(
                    (_, i) => i !== newSpliteeIndex
                );

                if (!till.splits.length) {
                    till.splits = ['0.00'];
                }

                const totalSplit = till.splits.reduce(
                    (a, b) => a + toCents(b),
                    0
                );

                const splitEach = totalSplit / newSplitees.length;

                till.totalSplit = toDollars(totalSplit);
                till.splitEach = toDollars(splitEach);

                till.splitEachPercentage = toPercent(
                    splitEach / toCents(till.paidTips)
                );

                till.totalSplitPercentage = toPercent(
                    toCents(till.totalSplit) / toCents(till.paidTips)
                );

                const paidTips = toCents(till.paidTips);
                const received = paidTips - totalSplit;

                till.received = toDollars(received);
                till.receivedPercentage = toPercent(received / paidTips);
            }
        }

        setTills(newTills);
    };

    const centTills = tills.map(tillToCents);

    const totalSplitCents = centTills
        .map((till) => {
            const splitOut = till.totalSplit || 0;
            return splitOut > till.paidTips ? till.paidTips : splitOut;
        })
        .reduce((a, b) => a + b, 0);

    const totalPaidCents = centTills.reduce((a, b) => a + (b.paidTips || 0), 0);
    const totalSplitPercentage = toPercent(totalSplitCents / totalPaidCents);

    const onSplitBlur = (tillIndex, spliteeIndex) => {
        const till = tills[tillIndex];
        let { paidTips, splits } = tillToCents(till);
        splits[spliteeIndex] = splits[spliteeIndex] || 0;

        let totalSplit = splits.reduce((a, b) => a + (b || 0), 0);

        if (totalSplit > paidTips) {
            const remaining =
                paidTips -
                splits.reduce((a, b, i) => {
                    return a + (i === spliteeIndex ? 0 : b);
                }, 0);

            splits[spliteeIndex] = remaining;
        }

        totalSplit = splits.reduce((a, b) => a + (b || 0), 0);

        const averageSplit = totalSplit / splitees.length;
        const received = paidTips - totalSplit;

        updateTills(tillIndex, {
            ...till,
            splitEach: toDollars(averageSplit),
            splitEachPercentage: toPercent(averageSplit / paidTips),
            splits: splits.map((split) => toDollars(split)),
            totalSplit: toDollars(totalSplit),
            totalSplitPercentage: toPercent(totalSplit / paidTips),
            received: toDollars(received),
            receivedPercentage: toPercent(received / paidTips)
        });
    };

    const [usePercentage, setUsePercentage] = useState(false);

    return (
        <div className="wrap">
            <section>
                <h3>Tills:</h3>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ marginRight: '32px' }}>
                        Dollars ($):
                        <input
                            type="radio"
                            value="dollars"
                            checked={!usePercentage}
                            onChange={() => setUsePercentage(!usePercentage)}
                        />
                    </label>
                    <label>
                        Percentage of paid (%):
                        <input
                            type="radio"
                            value="percentage"
                            checked={usePercentage}
                            onChange={() => setUsePercentage(!usePercentage)}
                        />
                    </label>
                </div>
                <table className="tip-table">
                    <thead>
                        <tr>
                            <th className="tip-table-employee">ID</th>
                            <th>Paid</th>
                            <th>Split Each</th>
                            <th>Total Split</th>
                            <th>Received</th>
                            <th className="tip-table-delete">&nbsp;</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tills.map((till, i) => (
                            <TillRow
                                {...till}
                                index={i}
                                onChange={updateTills}
                                spliteeLength={splitees.length}
                                usePercentage={usePercentage}
                                paidTips={till.paidTips}
                                key={`till-${i}`}
                            />
                        ))}
                    </tbody>
                </table>
                <button onClick={() => updateTills(tills.length)}>
                    Add Till
                </button>
            </section>

            <p style={{ margin: '16px 8px 16px 8px' }}>
                Splitting <strong>{formatDollars(totalSplitCents)}</strong> from{' '}
                <strong>{formatDollars(totalPaidCents)}</strong> collected{' '}
                <strong>({totalSplitPercentage})</strong>.
            </p>

            <section>
                <h3>Splitees:</h3>
                <table className="tip-table">
                    <thead>
                        <tr>
                            <th className="tip-table-employee">ID</th>
                            {tills.map((till, i) => (
                                <th key={`splitee-th-${i}`}>{till.employee}</th>
                            ))}
                            <th style={{ width: '50px' }}>Total</th>
                            <th className="tip-table-delete">&nbsp;</th>
                        </tr>
                    </thead>
                    <tbody>
                        {splitees.map((splitee, i) => {
                            const splits = tills.map((till) => till.splits[i]);

                            return (
                                <SpliteeRow
                                    splitee={splitee}
                                    splits={splits}
                                    index={i}
                                    key={`splitee-${i}`}
                                    onChange={(spliteeIndex, splitee) =>
                                        updateSplitees(spliteeIndex, splitee)
                                    }
                                    onSplitChange={(tillIndex, split) => {
                                        const till = tills[tillIndex];

                                        const tillSplits = [...till.splits];
                                        tillSplits[i] = split;

                                        updateTills(tillIndex, {
                                            ...till,
                                            splits: tillSplits
                                        });
                                    }}
                                    onSplitBlur={onSplitBlur}
                                />
                            );
                        })}
                    </tbody>
                </table>
                <button onClick={() => updateSplitees(splitees.length)}>
                    Add Splitee
                </button>
            </section>
        </div>
    );
}

export default App;
