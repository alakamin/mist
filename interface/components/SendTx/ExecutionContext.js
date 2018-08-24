import React, { Component } from 'react';
import DappIdenticon from '../DappIdenticon';

class ExecutionContext extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showDetails: false
    };

    this.formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  }

  formattedBalance() {
    return EthTools.formatBalance(
      web3.utils.toBN(this.props.value || 0),
      '0,0.00[0000000000000000]',
      'ether'
    );
  }

  shortenAddress(address) {
    if (_.isString(address)) {
      return address.substr(0, 6) + '...' + address.substr(-4);
    }
  }

  renderExecutionSentence() {
    if (this.props.isNewContract) {
      const bytesCount = encodeURI(this.props.data).split(/%..|./).length - 1;

      return (
        <div className="execution-context__sentence">
          <div>
            Upload <span className="bold">New Contract</span>
          </div>
          <div className="execution-context__subtext">
            About {bytesCount} bytes
          </div>
        </div>
      );
    }

    if (this.props.toIsContract) {
      // Token transfers
      if (this.props.executionFunction === 'transfer(address,uint256)') {
        const decimals = this.props.token.decimals;
        if (this.props.params.length === 0) {
          return;
        }
        const tokenCount = this.props.params[1].value.slice(
          0,
          -Math.abs(decimals)
        );
        const tokenSymbol =
          this.props.token.symbol || i18n.t('mist.newTx.tokens');

        return (
          <div className="execution-context__sentence">
            {i18n.t('mist.newTx.transfer')}{' '}
            <span className="bold">
              {tokenCount} {tokenSymbol}
            </span>
          </div>
        );
      }

      const params = this.props.executionFunction.match(/\((.+)\)/i);

      // Unknown/generic function execution:
      return (
        <div className="execution-context__sentence">
          Executing <span className="bold">Contract Function</span>
        </div>
      );
    }

    let conversion;
    if (this.props.network === 'main') {
      const value = this.calculateTransferValue();
      if (value) {
        conversion = <span>About {value} USD</span>;
      }
    } else {
      conversion = (
        <span>
          $0 (<span className="capitalize">{this.props.network}</span>)
        </span>
      );
    }

    return (
      <div className="execution-context__sentence">
        <div>
          Transfer <span className="bold">{this.formattedBalance()} ETHER</span>
        </div>
        <div className="execution-context__subtext">{conversion}</div>
      </div>
    );
  }

  calculateTransferValue() {
    const { value, etherPriceUSD } = this.props;

    if (!value || !etherPriceUSD) {
      return;
    }

    const bigValue = web3.utils.isHex(value)
      ? new BigNumber(web3.utils.hexToNumberString(value))
      : new BigNumber(value);
    const fee = bigValue
      .times(etherPriceUSD)
      .dividedBy(new BigNumber('1000000000000000000'));
    return this.formatter.format(fee);
  }

  handleDetailsClick = () => {
    this.setState({ showDetails: !this.state.showDetails }, () =>
      this.props.adjustWindowHeight()
    );
  };

  renderMoreDetails() {
    const {
      executionFunction,
      toIsContract,
      isNewContract,
      value,
      estimatedGas,
      token
    } = this.props;

    if (!toIsContract && !isNewContract) {
      return null;
    }

    const isTokenTransfer =
      this.props.executionFunction === 'transfer(address,uint256)';

    const showTxExecutingFunction =
      executionFunction && !isNewContract && !isTokenTransfer;

    let tokenDisplayName;
    if (isTokenTransfer) {
      if (token.name !== token.symbol) {
        tokenDisplayName = `${token.name} (${token.symbol})`;
      } else {
        tokenDisplayName = token.name;
      }
    }

    if (!this.state.showDetails) {
      return (
        <div
          className="execution-context__details-link"
          onClick={this.handleDetailsClick}
        >
          {i18n.t('mist.sendTx.showDetails')}
        </div>
      );
    }

    const params = this.props.params.map(param => {
      return (
        <div key={Math.random()} className="execution-context__param">
          <div className="execution-context__param-value">
            <div className="execution-context__param-unicode">{'\u2192'}</div>
            {param.type === 'address' ? (
              <div className="execution-context__param-identicon">
                <DappIdenticon identity={param.value} size="small" />
              </div>
            ) : null}
            {param.value}
          </div>
          <div className="execution-context__param-type">{param.type}</div>
        </div>
      );
    });

    return (
      <div className="execution-context__details">
        {showTxExecutingFunction && (
          <div className="execution-context__details-row">
            {i18n.t('mist.newTx.transactionExecutingFunction')}{' '}
            <span className="execution-context__execution-function">
              {executionFunction.slice(0, executionFunction.indexOf('('))}
            </span>
          </div>
        )}

        <div className="execution-context__details-row">
          {i18n.t('mist.newTx.etherAmount')}{' '}
          <span className="bold">{this.formattedBalance(value)}</span>
        </div>

        <div className="execution-context__details-row">
          {i18n.t('mist.newTx.gasEstimate')}{' '}
          <span className="bold">{estimatedGas}</span>
        </div>

        {isTokenTransfer && (
          <div>
            {tokenDisplayName && (
              <div className="execution-context__details-row">
                {i18n.t('mist.newTx.tokenName')}{' '}
                <span className="bold">{tokenDisplayName}</span>
              </div>
            )}
            {token.address && (
              <div className="execution-context__details-row">
                {i18n.t('mist.newTx.tokenName')}{' '}
                <DappIdenticon identity={token.address} size="small" />
                <span className="bold">{token.address}</span>
              </div>
            )}
          </div>
        )}

        {this.props.params.length > 0 && (
          <div>
            <div className="execution-context__params-title">
              {i18n.t('mist.newTx.parameters')}
            </div>
            <div className="execution-context__params-table">{params}</div>
          </div>
        )}

        <div
          className="execution-context__details-link"
          onClick={this.handleDetailsClick}
        >
          {i18n.t('mist.sendTx.hideDetails')}
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="execution-context">
        {this.renderExecutionSentence()}
        {this.renderMoreDetails()}
      </div>
    );
  }
}

export default ExecutionContext;
