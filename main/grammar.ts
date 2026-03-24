/**
 * @file Blade grammar for tree-sitter
 * @author Emran Mashhadi Ramezan <2t5ukanu@duck.com>
 * @license MIT
 */

import NodeMap from "./NodeMap.ts";
import html from "../tree-sitter-html/grammar.js";

const nodes = new NodeMap();

/// <reference types="tree-sitter-cli/dsl" />

/**
 * Creates a rule to match one or more of the rules separated by a pipe
 *
 * @param {Rule} rule
 *
 * @returns {SeqRule}
 */
function pipeSep1(rule) {
  return seq(rule, repeat(seq('|', rule)));
}

/**
 * Creates a rule to  match one or more of the rules separated by an ampersand
 *
 * @param {Rule} rule
 * @returns {SeqRule}
 */
function ampSep1(rule) {
  return seq(rule, repeat(seq(token('&'), rule)));
}

/**
 * Creates a regex that matches the given word case-insensitively,
 * and will alias the regex to the word if aliasAsWord is true
 *
 * @param {string} word
 * @param {boolean} aliasAsWord
 *
 * @returns {RegExp|AliasRule}
 */
function keyword(word, aliasAsWord = true) {
  /** @type {RegExp|AliasRule} */
  let result = new RegExp(word, 'i');
  if (aliasAsWord) result = alias(result, word);
  return result;
}

const PREC = {
  COMMA: -1,
  CAST: -1,
  LOGICAL_OR_2: 1,
  LOGICAL_XOR: 2,
  LOGICAL_AND_2: 3,
  ASSIGNMENT: 4,
  TERNARY: 5,
  NULL_COALESCE: 6,
  LOGICAL_OR_1: 7,
  LOGICAL_AND_1: 8,
  BITWISE_OR: 9,
  BITWISE_XOR: 10,
  BITWISE_AND: 11,
  EQUALITY: 12,
  INEQUALITY: 13,
  PIPE: 14,
  CONCAT: 15,
  SHIFT: 16,
  PLUS: 17,
  TIMES: 18,
  EXPONENTIAL: 19,
  NEG: 20,
  INSTANCEOF: 21,
  INC: 22,
  SCOPE: 23,
  NEW: 24,
  CALL: 25,
  MEMBER: 26,
  DEREF: 27,
};

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}

export default grammar(html, {
  name: "blade",
  conflicts: $ => [
    [$.type, $.union_type, $.intersection_type, $.disjunctive_normal_form_type],
    [$.union_type, $.disjunctive_normal_form_type],
    [$.intersection_type],

    [$.namespace_name],
  ],

  rules: {
    // The entire grammar
    _node: ($) =>
      choice(
        ...nodes.add(
          // tree-sitter-html
          $.doctype,
          $.entity,
          $.text,
          $.element,
          $.script_element,
          $.style_element,
          $.erroneous_end_tag,
          // tree-sitter-blade
          $.keyword,
          $.php_statement,
          $._inline_directive,
          $.comment,
          $.switch,
          $.loop,
          $.envoy,
          $.livewire,
          // nested
          $.fragment,
          $.section,
          $.once,
          $.verbatim,
          $.stack,
          // conditional
          $.conditional,
        ),
      ),
    // ------------------

    // https://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: (_) => token(seq("{{--", /[^-]*-+([^}-][^-]*-+)*/, "}}")),

    // !keywords
    keyword: ($) =>
      alias(
        choice(
          "@csrf",
          "@viteReactRefresh",
          "@livewireStyles",
          "@livewireScripts",
          "@livewireScriptConfig",
          "@parent",
          "@inertia",
          "@inertiaHead",
          // log1x/sage-directives #77
          "@routes",
          "@permalink",
          "@title",
          "@content",
          "@excerpt",
          // WireUI
          "@wireUiScripts",
        ),
        $.directive,
      ),
    // ! PHP Statements
    php_statement: ($) =>
      choice($._escaped, $._unescaped, $._setup, $._raw, $._php),

    // From tree-sitter-php
    _php: ($) =>
      seq(
        $.php_tag,
        optional(alias($.text, $.php_only)),
        $.php_end_tag,
      ),

    php_tag: (_) => /<\?([pP][hH][pP]|=)?/,
    php_end_tag: (_) => "?>",
    // --------------------

    _escaped: ($) =>
      seq(
        "{{",
        optional(alias($.text, $.php_only)),
        "}}",
      ),
    _unescaped: ($) =>
      seq(
        "{!!",
        optional(alias($.text, $.php_only)),
        "!!}",
      ),

    // ! raw php
    _raw: ($) => choice($._inline_raw, $._multi_line_raw),

    _inline_raw: ($) => seq(alias("@php", $.directive), $._directive_parameter),

    _multi_line_raw: ($) =>
      seq(
        alias("@php", $.directive_start),
        optional(alias($.text, $.php_only)),
        alias("@endphp", $.directive_end),
      ),

    // tree-sitter-html override
    attribute: ($) =>
      choice(
        $._blade_attribute,
        $._html_attribute,
        $.php_statement,
      ),
    attribute_name: (_) => token(prec(-1, /[^<>"'/=\s]+/)),

    attribute_value: (_) => token(prec(-1, /[^<>"'/=\s]+/)),
    quoted_attribute_value: ($) =>
      choice(
        seq(
          "'",
          optional(
            repeat(
              choice(
                $.php_statement,
                $.conditional,
                $._inline_directive,
                $.comment,
                alias($._singly_quoted_attribute_text, $.attribute_value),
              ),
            ),
          ),
          "'",
        ),
        seq(
          '"',
          optional(
            repeat(
              choice(
                $.php_statement,
                $.conditional,
                $._inline_directive,
                $.comment,
                alias($._doubly_quoted_attribute_text, $.attribute_value),
              ),
            ),
          ),
          '"',
        ),
      ),

    // utilised from tree-sitter-html
    _html_attribute: ($) =>
      seq(
        $.attribute_name,
        optional(
          seq(
            "=",
            choice($.attribute_value, $.quoted_attribute_value),
          ),
        ),
      ),

    // ! Conditional Blade Attribute Directives
    _blade_attribute: ($) =>
      seq(
        alias(
          choice(
            "@class",
            "@style",
            "@checked",
            "@selected",
            "@disabled",
            "@readonly",
            "@required",
          ),
          $.directive,
        ),
        $._directive_parameter,
      ),

    // !inline directives
    _inline_directive: ($) =>
    choice(
      $.props,
      seq(
        alias(
          choice(
            "@include",
            "@includeIf",
            "@includeWhen",
            "@includeUnless",
            "@includeFirst",
            "@extends",
            "@yield",
            "@method",
            "@inject",
            "@each",
            "@vite",
            "@livewire",
            "@aware",
            "@servers",
            "@import",
            "@js",
            "@svg",
            "@use",
            "@stack",
            // log1x/sage-directives #77
            "@asset",
            "@json",
            "@script",
            "@thumbnail",
            "@extract",
            "@set",
            // ACF (Advanced Custom Fields)
            "@field",
            "@options",
            // WireUI
            "@wireUiScripts",
          ),
          $.directive,
        ),
        $._directive_parameter,
      )
    ),

    props: ($) => seq(
        "@props",
        '(',
        $.array_creation_expression,
        ')',
    ),

    // !nested directives

    fragment: ($) =>
      seq(
        alias("@fragment", $.directive_start),
        $._directive_parameter,
        optional(
          repeat1(
            choice(
              ...nodes.without(
                $.doctype,
                $.envoy,
                $.livewire,
                $.fragment,
                $.section,
                $.stack,
                $.once,
              ),
            ),
          ),
        ),
        alias("@endfragment", $.directive_end),
      ),

    // ! section
    section: ($) =>
      choice(
        seq(
          alias("@section", $.directive),
          "(",
          alias(/[^,()]+/, $.parameter),
          ",",
          alias(/[^,()]+/, $.parameter),
          ")",
        ),
        seq(
          alias("@section", $.directive_start),
          "(",
          alias(/[^,()]+/, $.parameter),
          ")",
          optional(
            repeat1(
              choice(
                ...nodes.without(
                  $.doctype,
                  $.section,
                  $.once,
                  $.envoy,
                  $.fragment,
                ),
              ),
            ),
          ),
          alias(/@(endsection|show)/, $.directive_end),
        ),
      ),

    once: ($) =>
      seq(
        alias("@once", $.directive_start),
        optional(
          repeat1(
            choice(...nodes.without($.doctype, $.envoy, $.section)),
          ),
        ),
        alias("@endonce", $.directive_end),
      ),

    verbatim: ($) =>
      seq(
        alias("@verbatim", $.directive_start),
        optional(
          repeat1(
            choice(...nodes.without($.doctype, $.livewire, $.envoy)),
          ),
        ),
        alias("@endverbatim", $.directive_end),
      ),

    stack: ($) =>
      choice(
        $._push,
        $._pushOnce,
        $._pushIf,
        $._prepend,
        $._prependOnce,
      ),

    _push: ($) =>
      seq(
        alias("@push", $.directive_start),
        $._directive_parameter,
        optional(
          repeat1(
            choice(
              ...nodes.without(
                $.doctype,
                $.envoy,
                $.livewire,
                $.loop,
                $._loop_operator,
                $.conditional,
                $.stack,
                $.once,
                $.fragment,
                $.section,
                $.verbatim,
              ),
            ),
          ),
        ),
        alias("@endpush", $.directive_end),
      ),

    _pushOnce: ($) =>
      seq(
        alias("@pushOnce", $.directive_start),
        $._directive_parameter,
        optional(
          repeat1(
            choice(
              ...nodes.without(
                $.doctype,
                $.envoy,
                $.livewire,
                $.loop,
                $._loop_operator,
                $.conditional,
                $.stack,
                $.once,
                $.fragment,
                $.section,
                $.verbatim,
              ),
            ),
          ),
        ),
        alias("@endPushOnce", $.directive_end),
      ),

    _pushIf: ($) =>
      seq(
        alias("@pushIf", $.directive_start),
        $._directive_parameter,
        optional(
          repeat1(
            choice(
              ...nodes.without(
                $.doctype,
                $.envoy,
                $.livewire,
                $.loop,
                $._loop_operator,
                $.conditional,
                $.stack,
                $.once,
                $.fragment,
                $.section,
                $.verbatim,
              ),
            ),
          ),
        ),
        alias("@endPushIf", $.directive_end),
      ),

    _prepend: ($) =>
      seq(
        alias("@prepend", $.directive_start),
        $._directive_parameter,
        optional(
          repeat1(
            choice(
              ...nodes.without(
                $.doctype,
                $.envoy,
                $.livewire,
                $.loop,
                $._loop_operator,
                $.conditional,
                $.stack,
                $.once,
                $.fragment,
                $.section,
                $.verbatim,
              ),
            ),
          ),
        ),
        alias("@endprepend", $.directive_end),
      ),

    _prependOnce: ($) =>
      seq(
        alias("@prependOnce", $.directive_start),
        $._directive_parameter,
        optional(
          repeat1(
            choice(
              ...nodes.without(
                $.doctype,
                $.envoy,
                $.livewire,
                $.loop,
                $._loop_operator,
                $.conditional,
                $.stack,
                $.once,
                $.fragment,
                $.section,
                $.verbatim,
              ),
            ),
          ),
        ),
        alias("@endPrependOnce", $.directive_end),
      ),

    // !Conditionals
    conditional: ($) =>
      choice(
        $._if,
        $._unless,
        $._isset,
        $._empty,
        $._auth,
        $._guest,
        $._production,
        $._env,
        $._hasSection,
        $._sectionMissing,
        $._error,
        $._authorization,
        $._feature,
        $._custom,
      ),

    // used in the conditional body rules
    conditional_keyword: ($) =>
      choice(
        alias("@else", $.directive),
        seq(
          alias(/@(elseif|else[a-zA-Z]+)/, $.directive),
          $._directive_parameter,
        ),
      ),

    _if: ($) =>
      seq(
        alias("@if", $.directive_start),
        $._conditional_directive_body,
        alias("@endif", $.directive_end),
      ),

    _unless: ($) =>
      seq(
        alias("@unless", $.directive_start),
        $._conditional_directive_body,
        alias("@endunless", $.directive_end),
      ),

    _isset: ($) =>
      seq(
        alias("@isset", $.directive_start),
        $._conditional_directive_body,
        alias("@endisset", $.directive_end),
      ),

    _empty: ($) =>
      seq(
        alias("@empty", $.directive_start),
        $._conditional_directive_body,
        alias("@endempty", $.directive_end),
      ),

    _auth: ($) =>
      seq(
        alias("@auth", $.directive_start),
        $._conditional_body_with_optional_parameter,
        alias("@endauth", $.directive_end),
      ),

    _guest: ($) =>
      seq(
        alias("@guest", $.directive_start),
        $._conditional_body_with_optional_parameter,
        alias("@endguest", $.directive_end),
      ),

    _production: ($) =>
      seq(
        alias("@production", $.directive_start),
        optional($._conditonal_body),
        alias("@endproduction", $.directive_end),
      ),

    _env: ($) =>
      seq(
        alias("@env", $.directive_start),
        $._conditional_directive_body,
        alias("@endenv", $.directive_end),
      ),

    _hasSection: ($) =>
      seq(
        alias("@hasSection", $.directive_start),
        $._conditional_directive_body,
        alias("@endif", $.directive_end),
      ),

    _sectionMissing: ($) =>
      seq(
        alias("@sectionMissing", $.directive_start),
        $._conditional_directive_body,
        alias("@endif", $.directive_end),
      ),

    _error: ($) =>
      seq(
        alias("@error", $.directive_start),
        $._conditional_directive_body,
        alias("@enderror", $.directive_end),
      ),

    // !Authorisation Directives
    _authorization: ($) => choice($._can, $._canany, $._cannot),

    _can: ($) =>
      seq(
        alias("@can", $.directive_start),
        $._conditional_directive_body,
        alias("@endcan", $.directive_end),
      ),

    _cannot: ($) =>
      seq(
        alias("@cannot", $.directive_start),
        $._conditional_directive_body,
        alias("@endcannot", $.directive_end),
      ),
    _canany: ($) =>
      seq(
        alias("@canany", $.directive_start),
        $._conditional_directive_body,
        alias("@endcanany", $.directive_end),
      ),
    // !Laravel Pennant
    _feature: ($) =>
      seq(
        alias("@feature", $.directive_start),
        $._conditional_directive_body,
        alias("@endfeature", $.directive_end),
      ),

    // !Custom if Statements
    _custom: ($) =>
      seq(
        choice(
          alias(/@unless[a-zA-Z\d]+/, $.directive_start),
          alias(token(prec(-1, /@[a-zA-Z\d]+/)), $.directive_start),
        ),
        $._conditional_directive_body,
        alias(token(prec(1, /@end[a-zA-Z\d]+/)), $.directive_end),
      ),

    // !switch
    switch: ($) =>
      seq(
        alias("@switch", $.directive_start),
        $._directive_parameter,
        repeat($._case),
        optional(
          seq(
            alias("@default", $.directive),
            repeat1(
              choice(
                ...nodes.without(
                  $.doctype,
                  $.section,
                  $.once,
                  $.stack,
                  $.verbatim,
                  $.envoy,
                  $.fragment,
                  $.switch,
                ),
              ),
            ),
          ),
        ),
        alias("@endswitch", $.directive_end),
      ),
    _case: ($) =>
      seq(
        alias("@case", $.directive),
        $._directive_parameter,
        optional(
          repeat1(
            choice(
              ...nodes.without(
                $.doctype,
                $.section,
                $.once,
                $.stack,
                $.verbatim,
                $.envoy,
                $.fragment,
                $.switch,
              ),
            ),
          ),
        ),
        optional(alias("@break", $.directive)),
      ),

    // !Loops
    loop: ($) => choice($._for, $._foreach, $._forelse, $._while),

    _loop_operator: ($) =>
      choice(
        seq(
          alias(/@(continue|break)/, $.directive),
          optional($._directive_parameter),
        ),
        alias("@empty", $.directive),
      ),

    _for: ($) =>
      seq(
        alias("@for", $.directive_start),
        $._loop_directive_body,
        alias("@endfor", $.directive_end),
      ),

    _foreach: ($) =>
      seq(
        alias("@foreach", $.directive_start),
        $._loop_directive_body,
        alias("@endforeach", $.directive_end),
      ),

    _forelse: ($) =>
      seq(
        alias("@forelse", $.directive_start),
        $._loop_directive_body,
        alias("@endforelse", $.directive_end),
      ),

    _while: ($) =>
      seq(
        alias("@while", $.directive_start),
        $._loop_directive_body,
        alias("@endwhile", $.directive_end),
      ),

    // !envoy
    envoy: ($) => choice($._task, $._story, $._hooks),

    _setup: ($) =>
      seq(
        alias("@setup", $.directive_start),
        optional(alias($.text, $.php_only)),
        alias("@endsetup", $.directive_end),
      ),

    _task: ($) =>
      seq(
        alias("@task", $.directive_start),
        $._envoy_directive_body,
        alias("@endtask", $.directive_end),
      ),

    _story: ($) =>
      seq(
        alias("@story", $.directive_start),
        $._envoy_directive_body,
        alias("@endstory", $.directive_end),
      ),

    _hooks: ($) =>
      choice(
        $._before,
        $._after,
        $._envoy_error,
        $._success,
        $._finished,
      ),

    _before: ($) =>
      seq(
        alias("@before", $.directive_start),
        optional(repeat($._notification)),
        alias("@endbefore", $.directive_end),
      ),
    _after: ($) =>
      seq(
        alias("@after", $.directive_start),
        optional(repeat($._notification)),
        alias("@endafter", $.directive_end),
      ),
    _envoy_error: ($) =>
      seq(
        alias("@error", $.directive_start),
        optional(repeat($._notification)),
        alias("@enderror", $.directive_end),
      ),
    _success: ($) =>
      seq(
        alias("@success", $.directive_start),
        optional(repeat($._notification)),
        alias("@endsuccess", $.directive_end),
      ),
    _finished: ($) =>
      seq(
        alias("@finished", $.directive_start),
        optional(repeat($._notification)),
        alias("@endfinished", $.directive_end),
      ),

    // !envoy:notification
    _notification: ($) =>
      seq(
        alias(
          /@(slack|discord|telegram|microsoftTeams)/,
          $.directive,
        ),
        $._directive_parameter,
      ),
    // !livewire 🪼
    livewire: ($) =>
      choice($._persist, $._teleport, $._volt, $._script, $._assets),
    _persist: ($) =>
      seq(
        alias("@persist", $.directive_start),
        $._directive_parameter,
        repeat1(
          choice(
            $.entity,
            $.text,
            $.element,
            $.php_statement,
            $.conditional,
          ),
        ),
        alias("@endpersist", $.directive_end),
      ),
    _teleport: ($) =>
      seq(
        alias("@teleport", $.directive_start),
        $._directive_parameter,
        repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.fragment,
              $.section,
              $.once,
              $.verbatim,
              $.stack,
            ),
          ),
        ),
        alias("@endteleport", $.directive_end),
      ),
    _volt: ($) =>
      seq(
        alias("@volt", $.directive_start),
        $._directive_parameter,
        repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.fragment,
              $.section,
              $.once,
              $.verbatim,
              $.stack,
            ),
          ),
        ),
        alias("@endvolt", $.directive_end),
      ),
    _script: ($) =>
      seq(
        alias("@script", $.directive_start),
        optional(repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.fragment,
              $.section,
              $.once,
              $.verbatim,
              $.stack,
            ),
          ),
        )),
        alias("@endscript", $.directive_end),
      ),
    _assets: ($) =>
      seq(
        alias("@assets", $.directive_start),
        optional(repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.fragment,
              $.section,
              $.once,
              $.verbatim,
              $.stack,
            ),
          ),
        )),
        alias("@endassets", $.directive_end),
      ),

    /*-----------------------------------*
    /  Do NOT change below this line
    /  without running tests
    /  This is the engine
    /*----------------------------------*/

    // !conditional helpers

    _conditonal_body: ($) =>
      repeat1(choice(...nodes.with($.conditional_keyword).all())),

    _conditional_directive_body: ($) =>
      seq($._directive_parameter, optional($._conditonal_body)),

    _conditional_body_with_optional_parameter: ($) =>
      seq(optional($._directive_parameter), $._conditonal_body),

    // ! envoy helpers
    _envoy_if: ($) =>
      seq(
        alias("@if", $.directive_start),
        $._directive_parameter,
        choice($.conditional_keyword, $._envoy_body),
        alias("@endif", $.directive_end),
      ),

    _envoy_body: ($) => repeat1(choice($.text, $._envoy_if, $._escaped)),
    _envoy_directive_body: ($) =>
      seq($._directive_parameter, optional($._envoy_body)),

    // !loop helpers
    _loop_body: ($) =>
      repeat1(
        choice(
          ...nodes
            .with($._loop_operator)
            .without(
              $.doctype,
              $.envoy,
              $.livewire,
              $.section,
              $.fragment,
              $.once,
              $.verbatim,
              $.stack,
            ),
        ),
      ),

    _loop_directive_body: ($) =>
      seq($._directive_parameter, optional($._loop_body)),

    // !directive parameter
    _directive_parameter: ($) =>
      seq(
        "(",
        optional($.expression),
        ")",
      ),


    text: ($) => prec.right(repeat1($._text)),
    // hidden to reduce AST noise in php_only #39
    // It is selectively unhidden for other areas

    // Create alternative text rep for php_only
    _text: (_) =>
      // custom directive conflict resolution
      choice(
        token(prec(-1, /@[a-zA-Z\d]*[^\(-]/)),
        // orphan tags
        token(prec(-2, /[{}!@()?,-]/)),
        token(
          prec(
            -1,
            /[^\s(){!}@-]([^<>(){!}@,?]*[^<>{!}()@?,-])?/, // general text
          ),
        ),
      ),

    _singly_quoted_attribute_text: (_) =>
      prec.right(
        repeat1(
          choice(
            token(prec(-2, /[{}]/)),
            token(prec(-1, /[^'{}]/)),
          ),
        ),
      ),
    _doubly_quoted_attribute_text: (_) =>
      prec.right(
        repeat1(
          choice(
            token(prec(-2, /[{}]/)),
            token(prec(-1, /[^"{}]/)),
          ),
        ),
      ),

    match_expression: $ => seq(
      keyword('match'),
      field('condition', $.parenthesized_expression),
      field('body', $.match_block),
    ),

    match_block: $ => prec.left(
      seq(
        '{',
        commaSep(
          choice(
            $.match_conditional_expression,
            $.match_default_expression,
          ),
        ),
        optional(','),
        '}',
      ),
    ),

    match_condition_list: $ => seq(commaSep1($.expression), optional(',')),

    match_conditional_expression: $ => seq(
      field('conditional_expressions', $.match_condition_list),
      '=>',
      field('return_expression', $.expression),
    ),

    match_default_expression: $ => seq(
      keyword('default'),
      '=>',
      field('return_expression', $.expression),
    ),

    // ! PHP Expression Grammar (from tree-sitter-php)
    expression: ($) =>
      choice(
        $.conditional_expression,
        $.assignment_expression,
        $.binary_expression,
        $._unary_expression,
      ),

    conditional_expression: ($) => prec.left(
      PREC.TERNARY,
      seq(
        field("condition", $.expression),
        "?",
        field("body", optional($.expression)),
        ":",
        field("alternative", $.expression),
      )
    ),

    assignment_expression: ($) =>
      seq(
        field("left", $._variable),
        "=",
        field("right", $.expression),
      ),

    binary_expression: $ => choice(
      prec(PREC.INSTANCEOF, seq(
        field('left', $._unary_expression),
        field('operator', keyword('instanceof')),
        field('right', $._class_name_reference),
      )),
      prec.right(PREC.NULL_COALESCE, seq(
        field('left', $.expression),
        field('operator', '??'),
        field('right', $.expression),
      )),
      prec.right(PREC.EXPONENTIAL, seq(
        field('left', $.expression),
        field('operator', '**'),
        field('right', $.expression),
      )),
      ...[
        [keyword('and'), PREC.LOGICAL_AND_2],
        [keyword('or'), PREC.LOGICAL_OR_2],
        [keyword('xor'), PREC.LOGICAL_XOR],
        ['||', PREC.LOGICAL_OR_1],
        ['&&', PREC.LOGICAL_AND_1],
        ['|', PREC.BITWISE_OR],
        ['^', PREC.BITWISE_XOR],
        ['&', PREC.BITWISE_AND],
        ['==', PREC.EQUALITY],
        ['!=', PREC.EQUALITY],
        ['<>', PREC.EQUALITY],
        ['===', PREC.EQUALITY],
        ['!==', PREC.EQUALITY],
        ['<', PREC.INEQUALITY],
        ['>', PREC.INEQUALITY],
        ['<=', PREC.INEQUALITY],
        ['>=', PREC.INEQUALITY],
        ['<=>', PREC.EQUALITY],
        ['|>', PREC.PIPE],
        ['.', PREC.CONCAT],
        ['<<', PREC.SHIFT],
        ['>>', PREC.SHIFT],
        ['+', PREC.PLUS],
        ['-', PREC.PLUS],
        ['*', PREC.TIMES],
        ['/', PREC.TIMES],
        ['%', PREC.TIMES],
        // @ts-ignore
      ].map(([op, p]) => prec.left(p, seq(
        field('left', $.expression),
        // @ts-ignore
        field('operator', op),
        field('right', $.expression),
      ))),
    ),

    unary_op_expression: $ => prec.left(PREC.NEG, seq(
      field('operator', choice('+', '-', '~', '!')),
      field('argument', $.expression),
    )),

    update_expression: $ => {
      const argument = field('argument', $._variable);
      const operator = field('operator', choice('--', '++'));
      return prec.left(PREC.INC, choice(
        seq(operator, argument),
        seq(argument, operator),
      ));
    },

    cast_expression: ($) => prec(PREC.CAST,
      seq("(", field("type", $.cast_type), ")", field("value", $._unary_expression))
    ),

    type: $ => choice(
      $._types,
      $.union_type,
      $.intersection_type,
      $.disjunctive_normal_form_type,
    ),

    _types: $ => choice(
      $.optional_type,
      $.named_type,
      $.primitive_type,
    ),

    named_type: $ => choice(
      $.name,
      $.qualified_name,
      $.relative_name,
    ),

    optional_type: $ => seq(
      '?',
      choice(
        $.named_type,
        $.primitive_type,
      ),
    ),

    bottom_type: _ => keyword('never', false),

    union_type: $ => pipeSep1($._types),

    intersection_type: $ => ampSep1($._types),

    disjunctive_normal_form_type: $ => prec.dynamic(-1, pipeSep1(choice(
      seq('(', $.intersection_type, ')'),
      $._types,
    ))),

    primitive_type: _ => choice(
      'array',
      'bool',
      keyword('callable', false), // not legal in property types
      keyword('false', false),
      'float',
      'int',
      keyword('iterable', false),
      keyword('mixed', false),
      'null',
      'object',
      'string',
      keyword('true', false),
      keyword('void', false),
    ),

    cast_type: _ => choice(
      keyword('array', false),
      keyword('binary', false),
      keyword('bool', false),
      keyword('boolean', false),
      keyword('double', false),
      keyword('float', false),
      keyword('int', false),
      keyword('integer', false),
      keyword('object', false),
      keyword('real', false),
      keyword('string', false),
      keyword('unset', false),
    ),

    _return_type: $ => seq(':', field('return_type', choice($.type, $.bottom_type))),

    _unary_expression: ($) => choice($.primary_expression, $.unary_op_expression, $.cast_expression),

    primary_expression: ($) =>
      choice(
        $._variable,
        $.literal,
        $.array_creation_expression,
        $.parenthesized_expression,
        $.function_call_expression,
        $.class_constant_access_expression,
        $.qualified_name,
        $.relative_name,
        $.name,
        $.update_expression,
        $.anonymous_function,
        $.arrow_function,
      ),

    anonymous_function: $ => seq(
      $._anonymous_function_header,
      field(
        'body',
         seq(
           '{',
           alias($.text, $.php_only),
           '}'
         )
      ),
    ),

    anonymous_function_use_clause: $ => seq(
      keyword('use'),
      '(',
      commaSep1(choice($.by_ref, $.variable_name)),
      optional(','),
      ')',
    ),

    _anonymous_function_header: $ => seq(
      optional(field('attributes', $.attribute_list)),
      optional(field('static_modifier', $.static_modifier)),
      keyword('function'),
      optional(field('reference_modifier', $.reference_modifier)),
      field('parameters', $.formal_parameters),
      optional($.anonymous_function_use_clause),
      optional($._return_type),
    ),

    _arrow_function_header: $ => seq(
      optional(field('attributes', $.attribute_list)),
      optional(field('static_modifier', $.static_modifier)),
      keyword('fn'),
      optional(field('reference_modifier', $.reference_modifier)),
      field('parameters', $.formal_parameters),
      optional($._return_type),
    ),

      formal_parameters: $ => seq(
        '(',
        commaSep(choice(
          $.simple_parameter,
          $.variadic_parameter,
          $.property_promotion_parameter,
        )),
        optional(','),
        ')',
      ),

    reference_modifier: _ => '&',
    static_modifier: _ => keyword('static'),

    arrow_function: $ => seq(
      $._arrow_function_header,
      '=>',
      field('body', $.expression),
    ),

    property_promotion_parameter: $ => seq(
      optional(field('attributes', $.attribute_list)),
      field('visibility', $.visibility_modifier),
      field('readonly', optional($.readonly_modifier)),
      field('type', optional($.type)), // Note: callable is not a valid type here, but instead of complicating the parser, we defer this checking to any intelligence using the parser
      field('name', choice($.by_ref, $.variable_name)),
      optional(seq('=', field('default_value', $.expression))),
      optional(alias($.text, $.property_hook_list)),
    ),

    simple_parameter: $ => seq(
      optional(field('attributes', $.attribute_list)),
      field('type', optional($.type)),
      optional(field('reference_modifier', $.reference_modifier)),
      field('name', $.variable_name),
      optional(seq('=', field('default_value', $.expression))),
    ),

    variadic_parameter: $ => seq(
      optional(field('attributes', $.attribute_list)),
      field('type', optional($.type)),
      optional(field('reference_modifier', $.reference_modifier)),
      '...',
      field('name', $.variable_name),
    ),

    _variable: ($) => choice($.variable_name, $.member_access_expression, $.subscript_expression),

    variable_name: ($) => seq("$", alias(/[a-zA-Z_][a-zA-Z0-9_]*/, $.name)),

    by_ref: $ => seq('&', $._variable),

    _variable_member_access_expression: $ => prec(PREC.MEMBER, seq(
      field('object', $._new_variable),
      '->',
      $._member_name,
    )),

    member_access_expression: $ => prec(PREC.MEMBER, seq(
      field('object', $._dereferencable_expression),
      '->',
      $._member_name,
    )),

    _variable_nullsafe_member_access_expression: $ => prec(PREC.MEMBER, seq(
      field('object', $._new_variable),
      '?->',
      $._member_name,
    )),

    nullsafe_member_access_expression: $ => prec(PREC.MEMBER, seq(
      field('object', $._dereferencable_expression),
      '?->',
      $._member_name,
    )),

    final_modifier: _ => keyword('final'),
    abstract_modifier: _ => keyword('abstract'),
    readonly_modifier: _ => keyword('readonly'),

    visibility_modifier: $ => seq(
      choice(
        keyword('public'),
        keyword('protected'),
        keyword('private'),
      ),
      optional(seq(
        token.immediate('('),
        alias($.name, $.operation),
        token.immediate(')'),
      )),
    ),

    subscript_expression: ($) =>
      seq(field("object", $._dereferencable_expression), "[", optional($.expression), "]"),

    _variable_subscript_expression: $ => seq(
      $._new_variable,
      seq('[', optional($.expression), ']'),
    ),

    _dereferencable_subscript_expression: $ => seq(
      $._dereferencable_expression,
      seq('[', optional($.expression), ']'),
    ),

    _variable_scoped_property_access_expression: $ => prec(PREC.MEMBER, seq(
      field('scope', choice($._name, $._new_variable)),
      '::',
      field('name', $._simple_variable),
    )),

    scoped_property_access_expression: $ => prec(PREC.MEMBER, seq(
      field('scope', $._scope_resolution_qualifier),
      '::',
      field('name', $._simple_variable),
    )),

    _member_name: $ => choice(
      field('name', choice($.name, $._simple_variable)),
      seq('{', field('name', $.expression), '}'),
    ),

    _dereferencable_expression: ($) => prec(
      PREC.DEREF,
      choice($._variable, $.parenthesized_expression, $.array_creation_expression)
    ),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    function_call_expression: ($) =>
      seq(field("function", $.name), field("arguments", $.arguments)),

    arguments: ($) => seq("(", optional(seq(commaSep1($.argument), optional(","))), ")"),

    argument: ($) =>
      seq(optional($._argument_name), choice($.expression, $.variadic_unpacking)),

    _argument_name: ($) => seq(field("name", alias($.name, $.name)), ":"),

    variadic_unpacking: ($) => seq("...", $.expression),

    class_constant_access_expression: ($) =>
      seq(field("scope", $._scope_resolution_qualifier), "::", field("name", alias($.name, $.name))),

    _scope_resolution_qualifier: ($) =>
      choice($.qualified_name, $.relative_scope, $.name),

    relative_scope: (_) => choice("self", "parent", "static"),

    qualified_name: ($) =>
      seq(
        field("prefix", seq(optional("\\"), optional($.namespace_name), "\\")),
        alias($.name, $.name),
      ),

    relative_name: $ => seq(
      field('prefix', seq(
        keyword('namespace'),
        optional(seq('\\', $.namespace_name)),
        '\\',
      )),
      $.name,
    ),

    _name: $ => choice(
      alias(keyword('static', false), $.name),
      $.name,
      $.qualified_name,
    ),

    _class_name_reference: $ => choice(
      $._name,
      $._new_variable,
      $.parenthesized_expression,
    ),

    dynamic_variable_name: $ => choice(
      seq('$', $._simple_variable),
      seq('$', '{', $.expression, '}'),
    ),

    _simple_variable: $ => choice($.variable_name, $.dynamic_variable_name),

    _new_variable: $ => prec(1, choice(
      $._simple_variable,
      alias($._variable_subscript_expression, $.subscript_expression),
      alias($._variable_member_access_expression, $.member_access_expression),
      alias($._variable_nullsafe_member_access_expression, $.nullsafe_member_access_expression),
      alias($._variable_scoped_property_access_expression, $.scoped_property_access_expression),
    )),

    namespace_name: ($) =>
      seq(alias(/[a-zA-Z_][a-zA-Z0-9_]*/, $.name), repeat(seq("\\", alias(/[a-zA-Z_][a-zA-Z0-9_]*/, $.name)))),

    array_creation_expression: ($) => choice(
      seq("[", commaSep($.array_element_initializer), optional(","), "]"),
      seq("array", "(", commaSep($.array_element_initializer), optional(","), ")"),
    ),

    attribute_group: $ => seq(
      '#[',
      commaSep1($.attribute),
      optional(','),
      ']',
    ),

    attribute_list: $ => repeat1($.attribute_group),

    array_element_initializer: $ => prec.right(choice(
      $.array_element_value_initializer,
      $.array_element_key_value_initializer,
      $.array_element_spreading_initializer,
    )),

    array_element_value_initializer: $ => $.expression,
    array_element_key_value_initializer: $ =>
      seq(
        field("key", $.expression),
        "=>",
        field("value", $.expression)
      ),
    array_element_spreading_initializer: $ =>
        seq("...", $.expression),

    literal: ($) =>
      choice($.integer, $.float, $._string, $.boolean, $.null),

    integer: (_) => token(choice(/[1-9]\d*/, /0[xX][0-9a-fA-F]+/, /0[0-7]+/, /0[bB][01]+/)),

    float: _ => /\d*(_\d+)*((\.\d*(_\d+)*)?([eE][\+-]?\d+(_\d+)*)|(\.\d*(_\d+)*)([eE][\+-]?\d+(_\d+)*)?)/,

    _string: ($) => choice($.string, $.encapsed_string),

    string: ($) =>
      seq(
        "'",
        repeat(choice(token(prec(1, /[^'\\]+/)), token.immediate("\\'"))),
        "'",
      ),

    encapsed_string: ($) =>
      seq(
        '"',
        repeat(
          choice(
            token(prec(1, /[^"\\{]+/)),
            $.escape_sequence,
            seq($.variable_name, token(prec(1, /[^"\\]*/))),
          ),
        ),
        '"',
      ),

    escape_sequence: (_) =>
      token.immediate(
        seq(
          "\\",
          choice("n", "r", "t", "\\", "$", '"', "'", /[0-7]{1,3}/, /x[0-9A-Fa-f]{1,2}/),
        ),
      ),

    boolean: (_) => token(choice("true", "false")),

    null: (_) => "null",

    name: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});
