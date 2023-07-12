import { Literal, ParseLiteral } from './literal.parser';
import { ParseType, Type } from './type.parser';
import { ConsumeWhitespace, isWhitespaceConsumed } from './whitespace.parser';
import { ParserError } from '../errors';
import { Head, UnexpectedCharOrEndOfSource } from '../helpers';
import { ParseIdentifier } from './identifier.parser';


export declare class Argument<Name extends string = string, Value extends Literal | Variable = Literal | Variable> {
    _: 'Argument';
    name: Name;
    value: Value;
}

export declare class Variable<Name extends string = string, VariableType extends Type = Type> {
    _: 'Variable';
    name: Name;
    type: VariableType;
}

/**
 * @param {string} source
 *
 * @returns [arguments: Argument[] | Variable[], sourceTail: string]
 */
export type ParseArguments<Source extends string, Variables extends boolean = false> =
    isWhitespaceConsumed<Source> extends false ?
        ParseArguments<ConsumeWhitespace<Source>, Variables>
    : Source extends `(${infer tail}` ?
        ParseArgumentsBody<tail, Variables> extends [infer arguments, infer tail2 extends string] ?
            tail2 extends `)${infer tail3}` ?
                [arguments, tail3]
            : ParserError<`Expected ")", got ${UnexpectedCharOrEndOfSource<tail2>}`>
        : ParseArgumentsBody<tail, Variables> // error pass-through
    : ParserError<`Expected "(", got ${UnexpectedCharOrEndOfSource<Source>}`>;

type ParseArgumentsBody<Source extends string, Variables extends boolean> =
    isWhitespaceConsumed<Source> extends false ?
        ParseArgumentsBody<ConsumeWhitespace<Source>, Variables>
    : Source extends `)${string}` ?
        [[], Source]
    : Source extends '' ?
        ParserError<`Expected ")", got ${UnexpectedCharOrEndOfSource<Source>}`>
    : Variables extends true ?
        ParseVariable<Source> extends [infer variable, infer tail extends string] ?
            ParseArgumentsBody<tail, Variables> extends [infer variables extends Variable[], infer tail2] ?
                [[variable, ...variables], tail2]
            : ParseArgumentsBody<tail, Variables> // error pass-through
        : ParseVariable<Source>
    : ParseArgument<Source> extends [infer argument, infer tail extends string] ?
        ParseArgumentsBody<tail, Variables> extends [infer arguments extends Argument[], infer tail2] ?
            [[argument, ...arguments], tail2]
        : ParseArgumentsBody<tail, Variables> // error pass-through
    : ParseArgument<Source>; // error pass-through

type ParseArgument<Source extends string> =
    isWhitespaceConsumed<Source> extends false ?
        ParseArgument<ConsumeWhitespace<Source>>
    : ParseIdentifier<Source> extends [infer identifier extends string, infer parseIdentifierTail extends string] ?
        ConsumeWhitespace<parseIdentifierTail> extends `:${infer tail}` ?
            ParseLiteral<ConsumeWhitespace<tail>> extends [infer literal extends Literal, infer tail2] ?
                [Argument<identifier, literal>, tail2]
                : ParseLiteral<tail> // error pass-through
        : ParserError<`Expected ":", got ${UnexpectedCharOrEndOfSource<ConsumeWhitespace<parseIdentifierTail>>}`>
    : ParseIdentifier<Source>; // error pass-through

type ParseVariable<Source extends string> =
    isWhitespaceConsumed<Source> extends false ?
        ParseVariable<ConsumeWhitespace<Source>>
    : Source extends `$${infer tail}` ?
        ParseIdentifier<tail> extends [infer identifier extends string, infer parseIdentifierTail extends string] ?
            ConsumeWhitespace<parseIdentifierTail> extends `:${infer tail2}` ?
                ParseType<tail2> extends [infer variableType extends Type, infer tail3] ?
                    [Variable<identifier, variableType>, tail3]
                : ParseType<tail2>
            : ParserError<`Expected ":", got ${UnexpectedCharOrEndOfSource<ConsumeWhitespace<parseIdentifierTail>>}`>
        : ParseIdentifier<tail> // error pass-through
    : ParserError<`Expected variable to start with $`>;
