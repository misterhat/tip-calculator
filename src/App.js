import './App.css';
import CurrencyInput from 'react-currency-input-field';
import { useState } from 'react';

const MAX_EMPLOYEE_LENGTH = 5;

// the spliters
const defaultTill = {
    employee: '',
    paidTips: '0.00',
    splitEach: '0.00',
    splits: ['0.00'],
    totalSplitOut: '0.00',
    received: '0.00'
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

// convert a till row to cents to avoid floaty math
function tillToCents(till) {
    return {
        paidTips: toCents(till.paidTips),
        splitEach: toCents(till.splitEach),
        splits: till.splits.map(toCents),
        totalSplitOut: toCents(till.totalSplitOut),
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
                                ...till,
                                paidTips: '0.00'
                            });

                            return;
                        }

                        let { paidTips, splitEach, totalSplitOut, received } =
                            tillToCents(till);

                        if (totalSplitOut >= paidTips) {
                            onChange(props.index, {
                                ...till,
                                paidTips: toDollars(paidTips),
                                splitEach: toDollars(0),
                                splits: Array.from({
                                    length: spliteeLength
                                }).map(() => toDollars(0)),
                                totalSplitOut: toDollars(0),
                                received: toDollars(paidTips)
                            });
                        } else {
                            onChange(props.index, {
                                ...till,
                                paidTips: toDollars(paidTips),
                                received: toDollars(paidTips - totalSplitOut)
                            });
                        }
                    }}
                    value={props.paidTips}
                    placeholder="Tip amount"
                />
            </td>
            <td>
                <TillCurrencyInput
                    onValueChange={(value) =>
                        onChange(props.index, { ...till, splitEach: value })
                    }
                    onBlur={() => {
                        const value = till.splitEach;

                        if (!value) {
                            const splitEach = (
                                Number(till.totalSplitOut) / spliteeLength
                            ).toFixed(2);

                            onChange(props.index, {
                                ...till,
                                splitEach,
                                splits: Array.from({
                                    length: spliteeLength
                                }).map(() => splitEach)
                            });

                            return;
                        }

                        let { paidTips, splitEach } = tillToCents(till);
                        let totalSplitOut = splitEach * spliteeLength;

                        if (totalSplitOut > paidTips) {
                            totalSplitOut = paidTips;
                        }

                        totalSplitOut = findNearestDivisibleNumber(
                            totalSplitOut,
                            spliteeLength,
                            paidTips
                        );

                        const splitEachDollars = toDollars(
                            totalSplitOut / spliteeLength
                        );

                        onChange(props.index, {
                            ...till,
                            splitEach: splitEachDollars,
                            splits: Array.from({ length: spliteeLength }).map(
                                () => splitEachDollars
                            ),
                            totalSplitOut: toDollars(totalSplitOut),
                            received: toDollars(paidTips - totalSplitOut)
                        });
                    }}
                    value={props.splitEach}
                    placeholder="Split-out each"
                />
            </td>
            <td>
                <TillCurrencyInput
                    onValueChange={(value) =>
                        onChange(props.index, { ...till, totalSplitOut: value })
                    }
                    onBlur={() => {
                        const value = till.totalSplitOut || 0;

                        const paidTips = toCents(till.paidTips);
                        let totalSplitOut = toCents(value);

                        if (totalSplitOut > paidTips) {
                            totalSplitOut = paidTips;
                        }

                        const splitEach = totalSplitOut / spliteeLength;

                        totalSplitOut = findNearestDivisibleNumber(
                            splitEach * spliteeLength,
                            spliteeLength,
                            paidTips
                        );

                        const splitEachDollars = toDollars(
                            totalSplitOut / spliteeLength
                        );

                        onChange(props.index, {
                            ...till,
                            splitEach: splitEachDollars,
                            splits: Array.from({ length: spliteeLength }).map(
                                () => splitEachDollars
                            ),
                            totalSplitOut: toDollars(totalSplitOut),
                            received: toDollars(paidTips - totalSplitOut)
                        });
                    }}
                    placeholder="Total split-out"
                    value={props.totalSplitOut}
                />
            </td>
            <td>
                <TillCurrencyInput
                    onValueChange={(value) =>
                        onChange(props.index, { ...till, received: value })
                    }
                    onBlur={() => {
                        const value = till.received || 0;

                        const paidTips = toCents(till.paidTips);
                        let received = toCents(value);

                        if (received >= paidTips) {
                            received = paidTips;
                        }

                        const totalSplitOut = findNearestDivisibleNumber(
                            paidTips - received,
                            spliteeLength,
                            paidTips
                        );

                        const splitEachDollars = toDollars(
                            totalSplitOut / spliteeLength
                        );

                        onChange(props.index, {
                            ...till,
                            splitEach: splitEachDollars,
                            splits: Array.from({ length: spliteeLength }).map(
                                () => splitEachDollars
                            ),
                            totalSplitOut: toDollars(totalSplitOut),
                            received: toDollars(paidTips - totalSplitOut)
                        });
                    }}
                    placeholder="Received tips"
                    value={props.received}
                />
            </td>
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

                const totalSplitOut = till.splits.reduce(
                    (a, b) => a + toCents(b),
                    0
                );

                till.splitEach = toDollars(totalSplitOut / newSplitees.length);
            }
        } else if (!newSplitee) {
            for (const till of newTills) {
                till.splits = till.splits.filter(
                    (_, i) => i !== newSpliteeIndex
                );

                if (!till.splits.length) {
                    till.splits = ['0.00'];
                }

                const totalSplitOut = till.splits.reduce(
                    (a, b) => a + toCents(b),
                    0
                );

                till.totalSplitOut = toDollars(totalSplitOut);
                till.splitEach = toDollars(totalSplitOut / newSplitees.length);

                till.received = toDollars(
                    toCents(till.paidTips) - totalSplitOut
                );
            }
        }

        setTills(newTills);
    };

    const centTills = tills.map(tillToCents);

    const totalSplitCents = centTills
        .map((till) => {
            const splitOut = till.totalSplitOut || 0;
            return splitOut > till.paidTips ? till.paidTips : splitOut;
        })
        .reduce((a, b) => a + b, 0);

    const totalPaidCents = centTills.reduce((a, b) => a + (b.paidTips || 0), 0);

    const totalSplitPercentage = (
        (totalSplitCents / totalPaidCents || 0) * 100
    ).toFixed(2);

    const onSplitBlur = (tillIndex, spliteeIndex) => {
        const till = tills[tillIndex];
        let { paidTips, splits } = tillToCents(till);
        splits[spliteeIndex] = splits[spliteeIndex] || 0;

        let totalSplitOut = splits.reduce((a, b) => a + (b || 0), 0);

        if (totalSplitOut > paidTips) {
            const remaining = paidTips - splits.reduce((a, b, i) => {
                return a + (i === spliteeIndex ? 0 : b);
            }, 0);

            splits[spliteeIndex] = remaining;
        }

        totalSplitOut = splits.reduce((a, b) => a + (b || 0), 0);

        const averageSplit = totalSplitOut / splitees.length;
        const received = paidTips - totalSplitOut;

        updateTills(tillIndex, {
            ...till,
            splitEach: toDollars(averageSplit),
            splits: splits.map((split) => toDollars(split)),
            totalSplitOut: toDollars(totalSplitOut),
            received: toDollars(received)
        });
    };

    return (
        <div className="wrap">
            <section>
                <h3>Tills:</h3>
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
                <strong>({totalSplitPercentage}%)</strong>.
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
